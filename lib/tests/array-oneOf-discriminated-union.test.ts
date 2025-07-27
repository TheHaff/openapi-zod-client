import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/116
test("array-oneOf-discriminated-union", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: {
            title: "array oneOf discriminated union",
            version: "v1",
        },
        paths: {
            "/test": {
                post: {
                    requestBody: {
                        required: true,
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ArrayRequest" } } },
                    },
                },
            },
        },
        components: {
            schemas: {
                ArrayRequest: {
                    type: "array",
                    items: {
                        oneOf: [
                            {
                                type: "object",
                                required: ["type", "a"],
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: ["a"],
                                    },
                                },
                            },
                            {
                                type: "object",
                                required: ["type", "b"],
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: ["b"],
                                    },
                                },
                            },
                        ],
                        discriminator: { propertyName: "type" },
                    },
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
