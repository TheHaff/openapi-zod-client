import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/49
test("missing-zod-chains", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.0",
        info: { title: "Schema test", version: "1.0.0" },
        components: {
            schemas: {
                test1: { type: "string", minLength: 5 },
                test2: { type: "integer", minimum: 10 },
                test3: {
                    required: ["text", "num"],
                    properties: { text: { type: "string", minLength: 5 }, num: { type: "integer", minimum: 10 } },
                },
                nulltype: { type: "object", nullable: true },
                anyOfType: {
                    anyOf: [
                        { type: "object", nullable: true },
                        { type: "object", properties: { foo: { type: "string" } } },
                    ],
                },
            },
        },
        paths: {
            "/pet": {
                put: {
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/test1" } } },
                        },
                        "401": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/test2" } } },
                        },
                        "402": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/test3" } } },
                        },
                        "403": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/nulltype" } } },
                        },
                        "404": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { $ref: "#/components/schemas/anyOfType" } } },
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
