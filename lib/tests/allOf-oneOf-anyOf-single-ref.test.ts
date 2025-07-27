import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/49
test("allOf-single-ref", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.2",
        info: {
            title: "allOf single ref",
            version: "v1",
        },
        paths: {
            "/test": {
                get: {
                    parameters: [
                        {
                            name: "allOf_ref_param",
                            schema: {
                                allOf: [{ $ref: "#/components/schemas/MyComponent" }],
                            },
                            in: "query",
                        },
                        {
                            name: "oneOf_ref_param",
                            schema: {
                                oneOf: [{ $ref: "#/components/schemas/MyComponent" }],
                            },
                            in: "query",
                        },
                        {
                            name: "anyOf_ref_param",
                            schema: {
                                anyOf: [{ $ref: "#/components/schemas/MyComponent" }],
                            },
                            in: "query",
                        },
                    ],
                },
            },
        },
        components: {
            schemas: {
                MyComponent: {
                    title: "MyComponent",
                    enum: ["one", "two", "three"],
                    type: "string",
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
