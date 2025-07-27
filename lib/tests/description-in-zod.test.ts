import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

test("description-in-zod", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "Numerical enums",
        },
        paths: {
            "/sample": {
                get: {
                    parameters: [
                        {
                            in: "query",
                            name: "foo",
                            schema: {
                                type: "integer",
                                enum: [1, -2, 3],
                            },
                            description: "foo description",
                        },
                        {
                            in: "query",
                            name: "bar",
                            schema: {
                                type: "number",
                                enum: [1.2, 34, -56.789],
                            },
                            description: "bar description",
                        },
                        {
                            in: "query",
                            name: "baz",
                            schema: {
                                type: "number",
                                enum: [1.3, 34.1, -57.89],
                            },
                            description: "baz\nmultiline\ndescription",
                        },
                        {
                            in: "query",
                            name: "qux",
                            schema: {
                                type: "string",
                            },
                            description: "      ", // spaces only description
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
    };

    const output = await generateZodClientFromOpenAPI({
        disableWriteToFile: true,
        openApiDoc,
        options: { withDescription: true },
    });
    expect(output).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
