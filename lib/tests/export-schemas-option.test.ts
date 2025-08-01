import { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("export-schemas-option", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/export-schemas-option": {
                get: {
                    operationId: "123_example",
                    responses: {
                        "200": {
                            content: { "application/json": { schema: { $ref: "#/components/schemas/Basic" } } },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                Basic: { type: "string" },
                UnusedSchemas: {
                    type: "object",
                    properties: {
                        nested_prop: { type: "boolean" },
                        another: { type: "string" },
                    },
                },
            },
        },
    };

    expect(getZodClientTemplateContext(openApiDoc, { shouldExportAllSchemas: false }).schemas).toMatchInlineSnapshot('{}');

    const ctx = getZodClientTemplateContext(openApiDoc, { shouldExportAllSchemas: true });

    expect(ctx.schemas).toMatchInlineSnapshot(`
      {
          "Basic": "z.string()",
          "UnusedSchemas": "z.looseObject({ nested_prop: z.boolean(), another: z.string() }).partial()",
      }
    `);

    const result = await generateZodClientFromOpenAPI({
        disableWriteToFile: true,
        openApiDoc,
        options: { shouldExportAllSchemas: true },
    });
    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";

      const Basic = z.string();
      const UnusedSchemas = z
        .looseObject({ nested_prop: z.boolean(), another: z.string() })
        .partial();

      export const schemas = {
        Basic,
        UnusedSchemas,
      };
      "
    `);
});
