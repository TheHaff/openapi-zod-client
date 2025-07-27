import { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("name-with-special-characters", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/name-with-special-characters": {
                get: {
                    operationId: "nameWithSPecialCharacters",
                    responses: {
                        "200": {
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/1Name-With-Special---Characters" },
                                },
                            },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                "1Name-With-Special---Characters": { type: "string" },
            },
        },
    };
    const ctx = getZodClientTemplateContext(openApiDoc);
    expect(ctx.endpoints).toMatchInlineSnapshot('undefined');

    const result = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc });
    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
