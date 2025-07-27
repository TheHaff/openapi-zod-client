import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/61
test("array-default-values", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "enums min max",
        },
        paths: {
            "/sample": {
                get: {
                    parameters: [
                        {
                            in: "query",
                            name: "array-empty",
                            schema: {
                                type: "array",
                                items: { type: "string" },
                                default: [],
                            },
                        },
                        {
                            in: "query",
                            name: "array-string",
                            schema: {
                                type: "array",
                                items: { type: "string" },
                                default: ["one", "two"],
                            },
                        },
                        {
                            in: "query",
                            name: "array-number",
                            schema: {
                                type: "array",
                                items: { type: "number" },
                                default: [1, 2],
                            },
                        },
                        {
                            in: "query",
                            name: "array-object",
                            schema: {
                                type: "array",
                                items: { type: "object", properties: { foo: { type: "string" } } },
                                default: [{ foo: "bar" }],
                            },
                        },
                        {
                            in: "query",
                            name: "array-ref-object",
                            schema: {
                                type: "array",
                                items: { $ref: "#/components/schemas/MyComponent" },
                                default: [{ id: 1, name: "foo" }],
                            },
                        },
                        {
                            in: "query",
                            name: "array-ref-enum",
                            schema: {
                                type: "array",
                                items: { $ref: "#/components/schemas/MyEnum" },
                                default: ["one", "two"],
                            },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "resoponse",
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                MyComponent: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                        },
                        name: {
                            type: "string",
                        },
                    },
                },
                MyEnum: {
                    type: "string",
                    enum: ["one", "two", "three"],
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
