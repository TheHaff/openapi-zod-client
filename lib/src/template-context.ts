import type { OpenAPIObject, ReferenceObject, SchemaObject } from "openapi3-ts";
import { sortObjKeysFromArray } from "pastable/server";
import { ts } from "tanu";

import { getOpenApiDependencyGraph } from "./getOpenApiDependencyGraph";
import type { TsConversionContext } from "./openApiToTypescript";
import { getTypescriptFromOpenApi } from "./openApiToTypescript";
import { getZodSchema } from "./openApiToZod";
import { topologicalSort } from "./topologicalSort";
import { asComponentSchema, normalizeString } from "./utils";
import type { CodeMetaData } from "./CodeMeta";
import { makeSchemaResolver } from "./makeSchemaResolver";

const file = ts.createSourceFile("", "", ts.ScriptTarget.ESNext, true);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const printTs = (node: ts.Node) => printer.printNode(ts.EmitHint.Unspecified, node, file);

export const getZodClientTemplateContext = (
    openApiDoc: OpenAPIObject,
    options?: TemplateContext["options"]
) => {
    const resolver = makeSchemaResolver(openApiDoc);
    const data = makeTemplateContext();

    const docSchemas = openApiDoc.components?.schemas ?? {};
    const depsGraphs = getOpenApiDependencyGraph(
        Object.keys(docSchemas).map((name) => asComponentSchema(name)),
        resolver.getSchemaByRef
    );

    const ctx: { resolver: typeof resolver; zodSchemaByName: Record<string, string>; schemaByName: Record<string, string> } = { 
        resolver, 
        zodSchemaByName: {}, 
        schemaByName: {} 
    };

    if (options?.shouldExportAllSchemas) {
        Object.entries(docSchemas).forEach(([name, schema]) => {
            if (!ctx.zodSchemaByName[name]) {
                ctx.zodSchemaByName[name] = getZodSchema({ schema, ctx, options }).toString();
            }
        });
    }

    const wrapWithLazyIfNeeded = (schemaName: string) => {
        const [code, ref] = [ctx.zodSchemaByName[schemaName]!, resolver.resolveSchemaName(schemaName)?.ref];
        const isCircular = ref && depsGraphs.deepDependencyGraph[ref]?.has(ref);
        if (isCircular) {
            data.circularTypeByName[schemaName] = true;
        }

        return isCircular ? `z.lazy(() => ${code})` : code;
    };

    for (const name in ctx.zodSchemaByName) {
        data.schemas[normalizeString(name)] = wrapWithLazyIfNeeded(name);
    }

    for (const ref in depsGraphs.deepDependencyGraph) {
        const isCircular = ref && depsGraphs.deepDependencyGraph[ref]?.has(ref);
        const tsCtx: TsConversionContext = { nodeByRef: {}, resolver, visitedsRefs: {} };

        // Specifically check isCircular if shouldExportAllTypes is false. Either should cause shouldGenerateType to be true.
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const shouldGenerateType = options?.shouldExportAllTypes || isCircular;
        const schemaName = shouldGenerateType ? resolver.resolveRef(ref).normalized : undefined;
        if (shouldGenerateType && schemaName && !data.types[schemaName]) {
            const node = getTypescriptFromOpenApi({
                schema: resolver.getSchemaByRef(ref),
                ctx: tsCtx,
                meta: { name: schemaName },
                options,
            }) as ts.Node;
            data.types[schemaName] = printTs(node).replace("export ", "");
            data.emittedType[schemaName] = true;

            for (const depRef of depsGraphs.deepDependencyGraph[ref] ?? []) {
                const depSchemaName = resolver.resolveRef(depRef).normalized;
                const isDepCircular = depsGraphs.deepDependencyGraph[depRef]?.has(depRef);

                if (!isDepCircular && !data.types[depSchemaName]) {
                    const nodeSchema = resolver.getSchemaByRef(depRef);
                    const node = getTypescriptFromOpenApi({
                        schema: nodeSchema,
                        ctx: tsCtx,
                        meta: { name: depSchemaName },
                        options,
                    }) as ts.Node;
                    data.types[depSchemaName] = printTs(node).replace("export ", "");
                    // defining types for strings and using the `z.ZodType<string>` type for their schema
                    // prevents consumers of the type from adding zod validations like `.min()` to the type
                    if (options?.shouldExportAllTypes && nodeSchema.type === "object") {
                        data.emittedType[depSchemaName] = true;
                    }
                }
            }
        }
    }

    // Sort schemas by dependencies
    const schemaOrderedByDependencies = topologicalSort(depsGraphs.deepDependencyGraph).map(
        (ref) => resolver.resolveRef(ref).ref
    );
    data.schemas = sortObjKeysFromArray(data.schemas, schemaOrderedByDependencies);

    return data;
};

const makeTemplateContext = (): TemplateContext => {
    return {
        schemas: {},
        types: {},
        circularTypeByName: {},
        emittedType: {},
        options: {},
    };
};

export type TemplateContext = {
    schemas: Record<string, string>;
    types: Record<string, string>;
    circularTypeByName: Record<string, true>;
    emittedType: Record<string, true>;
    options?: TemplateContextOptions | undefined;
};

export type TemplateContextOptions = {
    /**
     * when true, will export all `#/components/schemas` even when not used in any PathItemObject
     * @see https://github.com/astahmer/openapi-zod-client/issues/19
     */
    shouldExportAllSchemas?: boolean;
    /**
     * When true, will generate and output types for all schemas, not just circular ones.
     * This helps with "The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.ts(7056)" errors.
     */
    shouldExportAllTypes?: boolean;
    /**
     * when true, will make all properties of an object required by default (rather than the current opposite), unless an explicitly `required` array is set
     * @see https://github.com/astahmer/openapi-zod-client/issues/23
     */
    withImplicitRequiredProps?: boolean;
    /**
     * when true, will add the default values from the openapi schemas to the generated zod schemas
     *
     * @default true
     */
    withDefaultValues?: boolean;
    /**
     * when true, will add jsdoc comments to generated types
     * @default false
     */
    withDocs?: boolean;
    /**
     * schema complexity threshold to determine which one (using less than `<` operator) should be assigned to a variable
     * tl;dr higher means more schemas will be inlined (rather than assigned to a variable)
     * ^ if you want to always inline schemas, set it to `-1` (special value) or a high value such as `1000`
     * v if you want to assign all schemas to a variable, set it to `0`
     *
     * @default 4
     */
    complexityThreshold?: number;
    /**
     * when true, will add z.describe(xxx)
     * @see https://github.com/astahmer/openapi-zod-client/pull/143
     */
    withDescription?: boolean;
    /**
     * When true, all generated objects and arrays will be readonly.
     */
    allReadonly?: boolean;
    /**
     * When true, all generated zod objects will be strict - meaning no unknown keys will be allowed
     */
    strictObjects?: boolean;
    /**
     * Set default value when additionalProperties is not provided. Default to true.
     */
    additionalPropertiesDefaultValue?: boolean | SchemaObject;
    /**
     * When true, prevents using the exact same name for the same type
     * For example, if 2 schemas have the same type, but different names, export each as separate schemas
     * If 2 schemas have the same name but different types, export subsequent names with numbers appended
     */
    exportAllNamedSchemas?: boolean;
    /**
     * A function that runs in the schema conversion process to refine the schema before it's converted to a Zod schema.
     */
    schemaRefiner?: <T extends SchemaObject | ReferenceObject>(schema: T, parentMeta?: CodeMetaData) => T;
};
