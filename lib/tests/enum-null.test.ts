import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/61
test("enum-null", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "enum null",
        },
        components: {
            schemas: {
                "Null1": {
                    type: "string",
                    enum: [null],
                },
                "Null2": {
                    type: "string",
                    enum: ["a", null],
                },
                "Null3": {
                    type: "string",
                    enum: ["a", null],
                    nullable: true
                },
                "Null4": {
                    type: "string",
                    enum: [null],
                    nullable: true
                },
                "Compound": {
                    type: "object",
                    properties: {
                        "field": {
                            oneOf: [
                                { $ref: '#/components/schemas/Null1' },
                                { $ref: '#/components/schemas/Null2' },
                                { $ref: '#/components/schemas/Null3' },
                                { $ref: '#/components/schemas/Null4' },
                                { type: "string" }
                            ]
                        }
                    }
                }
            }
        },
        paths: {
            "/sample": {
                get: {
                    responses: {
                        "200": {
                            description: "one null",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Null1",
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "null with a string",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Null2",
                                    }
                                }
                            }
                        },
                        "401": {
                            description: "null with a string and nullable",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Null3",
                                    }
                                }
                            }
                        },
                        "402": {
                            description: "null with nullable",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Null4",
                                    }
                                }
                            }
                        },
                        "403": {
                            description: "object that references null",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Compound",
                                    }
                                }
                            }
                        },
                    },
                },
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({ disableWriteToFile: true, openApiDoc, options: { shouldExportAllTypes: true } });
    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";

      type Compound = Partial<{
        field: Null1 | Null2 | Null3 | Null4 | string;
      }>;
      type Null1 = null;
      type Null2 = "a" | null;
      type Null3 = "a" | null;
      type Null4 = null;
      "
    `);
});
