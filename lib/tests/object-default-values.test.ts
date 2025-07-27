import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/61
test("object-default-values", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "object default values",
        },
        paths: {
            "/sample": {
                get: {
                    parameters: [
                        {
                            in: "query",
                            name: "empty-object",
                            schema: {
                                type: "object",
                                properties: { foo: { type: "string" } },
                                default: {},
                            },
                        },
                        {
                            in: "query",
                            name: "default-object",
                            schema: {
                                type: "object",
                                properties: { foo: { type: "string" } },
                                default: { foo: "bar" },
                            },
                        },
                        {
                            in: "query",
                            name: "ref-object",
                            schema: {
                                type: "object",
                                additionalProperties: { $ref: "#/components/schemas/MyComponent" },
                                default: { id: 1, name: "foo" },
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
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc });
    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
