import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

test("param-with-content", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { title: "Swagger Petstore - OpenAPI 3.0", version: "1.0.11" },
        paths: {
            "/pet": {
                put: {
                    parameters: [
                        {
                            name: "store",
                            in: "path",
                            description: "Store number",
                            required: true,
                            schema: { type: "integer", format: "int32" },
                            example: 49,
                        },
                        {
                            name: "thing",
                            in: "query",
                            content: { "*/*": { schema: { $ref: "#/components/schemas/test1" } } },
                        },
                        {
                            name: "wrong param",
                            in: "query",
                            content: { "*/*": { $ref: "#/components/schemas/test2" } },
                        },
                        {
                            name: "Accept-Language",
                            in: "header",
                            description: "Accept language (fr-CA)",
                            content: { "*/*": { schema: { type: "string", default: "EN" } } },
                        },
                        {
                            name: "missing",
                            description: "missing both schema AND content, should default to unknown",
                            in: "query",
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/test3" } } },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                test1: { type: "object", properties: { text1: { type: "string" } } },
                test2: { type: "object", properties: { text2: { type: "number" } } },
                test3: { type: "object", properties: { text3: { type: "boolean" } } },
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc });
    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
