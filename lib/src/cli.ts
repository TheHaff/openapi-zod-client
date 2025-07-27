import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import SwaggerParser from "@apidevtools/swagger-parser";
import cac from "cac";
import type { OpenAPIObject } from "openapi3-ts";
import { safeJSONParse } from "pastable/server";
import { resolveConfig } from "prettier";

import { toBoolean } from "./utils";
import { generateZodClientFromOpenAPI } from "./generateZodClientFromOpenAPI";

const cli = cac("openapi-zod-client");
const packageJson = safeJSONParse(readFileSync(resolve(__dirname, "../../package.json"), "utf8"));

cli.command("<input>", "path/url to OpenAPI/Swagger document as json/yaml")
    .option("-o, --output <path>", "Output path for the zod schemas ts file (defaults to `<input>.schemas.ts`)")
    .option(
        "-t, --template <path>",
        "Template path for the handlebars template that will be used to generate the output"
    )
    .option("-p, --prettier <path>", "Prettier config path that will be used to format the output client file")

    .option("--export-schemas", "When true, will export all `#/components/schemas`")
    .option(
        "--implicit-required",
        "When true, will make all properties of an object required by default (rather than the current opposite), unless an explicitly `required` array is set"
    )
    .option("--with-description", "when true, will add z.describe(xxx)")
    .option("--with-docs", "when true, will add jsdoc comments to generated types")
    .option(
        "--complexity-threshold",
        "schema complexity threshold to determine which one (using less than `<` operator) should be assigned to a variable"
    )
    .option("--all-readonly", "when true, all generated objects and arrays will be readonly")
    .option("--export-types", "When true, will defined types for all object schemas in `#/components/schemas`")
    .option(
        "--additional-props-default-value",
        "Set default value when additionalProperties is not provided. Default to true.",
        { default: true }
    )
    .option(
        "--strict-objects",
        "Use strict validation for objects so we don't allow unknown keys. Defaults to false.",
        { default: false }
    )
    .action(async (input, options) => {
        console.log("Retrieving OpenAPI document from", input);
        const openApiDoc = (await SwaggerParser.bundle(input)) as OpenAPIObject;
        const prettierConfig = await resolveConfig(options.prettier || "./");
        const distPath = options.output || input + ".schemas.ts";
        const additionalPropertiesDefaultValue = toBoolean(options.additionalPropsDefaultValue, true);

        await generateZodClientFromOpenAPI({
            openApiDoc,
            distPath,
            prettierConfig,
            templatePath: options.template,
            options: {
                shouldExportAllSchemas: options.exportSchemas,
                shouldExportAllTypes: options.exportTypes,
                withImplicitRequiredProps: options.implicitRequired,
                withDocs: options.withDocs,
                complexityThreshold: options.complexityThreshold,
                withDescription: options.withDescription,
                allReadonly: options.allReadonly,
                strictObjects: options.strictObjects,
                additionalPropertiesDefaultValue,
            },
        });
        console.log(`Done generating <${distPath}> !`);
    });

cli.version(packageJson.version!);
cli.help();

cli.parse();
