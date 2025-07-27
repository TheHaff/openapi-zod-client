import { OpenAPIObject } from "openapi3-ts";
import { test, expect } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

test("jsdoc", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/test": {
                get: {
                    operationId: "123_example",
                    responses: {
                        "200": {
                            content: { "application/json": { schema: { $ref: "#/components/schemas/ComplexObject" } } },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                SimpleObject: {
                    type: "object",
                    properties: {
                        str: { type: "string" },
                    },
                },
                ComplexObject: {
                    type: "object",
                    properties: {
                        example: {
                            type: "string",
                            description: "A string with example tag",
                            example: "example",
                        },
                        examples: {
                            type: "string",
                            description: "A string with examples tag",
                            examples: ["example1", "example2"],
                        },
                        manyTagsStr: {
                            type: "string",
                            description: "A string with many tags",
                            minLength: 1,
                            maxLength: 10,
                            pattern: "^[a-z]*$",
                            enum: ["a", "b", "c"],
                        },
                        numMin: {
                            type: "number",
                            description: "A number with minimum tag",
                            minimum: 0,
                        },
                        numMax: {
                            type: "number",
                            description: "A number with maximum tag",
                            maximum: 10,
                        },
                        manyTagsNum: {
                            type: "number",
                            description: "A number with many tags",
                            minimum: 0,
                            maximum: 10,
                            default: 5,
                            example: 3,
                            deprecated: true,
                            externalDocs: { url: "https://example.com" },
                        },
                        bool: {
                            type: "boolean",
                            description: "A boolean",
                            default: true,
                        },
                        ref: { $ref: "#/components/schemas/SimpleObject" },
                        refArray: {
                            type: "array",
                            description: "An array of SimpleObject",
                            items: {
                                $ref: "#/components/schemas/SimpleObject",
                            },
                        },
                    },
                },
            },
        },
    };

    const output = await generateZodClientFromOpenAPI({
        disableWriteToFile: true,
        openApiDoc,
        options: {
            withDocs: true,
            shouldExportAllTypes: true,
        },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";

      type ComplexObject = Partial<{
        /**
         * A string with example tag
         *
         * @example "example"
         */
        example: string;
        /**
         * A string with examples tag
         *
         * @example Example 1: "example1"
         * @example Example 2: "example2"
         */
        examples: string;
        /**
         * A string with many tags
         *
         * @minLength 1
         * @maxLength 10
         * @pattern ^[a-z]*$
         * @enum a, b, c
         */
        manyTagsStr: "a" | "b" | "c";
        /**
         * A number with minimum tag
         *
         * @minimum 0
         */
        numMin: number;
        /**
         * A number with maximum tag
         *
         * @maximum 10
         */
        numMax: number;
        /**
         * A number with many tags
         *
         * @example 3
         * @deprecated
         * @default 5
         * @see https://example.com
         * @minimum 0
         * @maximum 10
         */
        manyTagsNum: number;
        /**
         * A boolean
         *
         * @default true
         */
        bool: boolean;
        ref: SimpleObject;
        /**
         * An array of SimpleObject
         */
        refArray: Array<SimpleObject>;
      }>;
      type SimpleObject = Partial<{
        str: string;
      }>;
      "
    `);
});
