import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/60
test("schema-type-list-3.1", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.1.0",
        info: { title: "Swagger Petstore - OpenAPI 3.1", version: "1.1" },
        paths: {
            "/pet": {
                put: {
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/test4" } } },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                test1: {
                    type: ["object", "null"],
                    properties: {
                        text1: { type: "string" },
                        name: { type: ["string", "null"], enum: ["Dogs", "Cats", "Mice"] },
                        another: { type: ["string", "number"], enum: ["Dogs", "Cats", "Mice"] },
                    },
                },
                test2: { type: ["object", "boolean"], properties: { text2: { type: "number" } } },
                test3: { type: ["number", "object"], properties: { text3: { type: "boolean" } } },
                test4: {
                    allOf: [
                        { $ref: "#/components/schemas/test1" },
                        { $ref: "#/components/schemas/test2" },
                        { $ref: "#/components/schemas/test3" },
                    ],
                },
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc });
    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
