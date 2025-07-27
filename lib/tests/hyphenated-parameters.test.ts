import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/78
test("common-parameters", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { title: "Swagger Petstore - OpenAPI 3.0", version: "1.0.11" },
        paths: {
            "/pet/{pet-id}/uploadImage": {
                post: {
                    parameters: [{ name: "pet-id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { type: "boolean" } } },
                        },
                    },
                },
            },
            "/pet/{owner_name}": {
                post: {
                    parameters: [{ name: "owner_name", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { type: "boolean" } } },
                        },
                    },
                },
            },
            "/pet/{owner_name-id}": {
                post: {
                    parameters: [{ name: "owner_name-id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        "200": {
                            description: "Successful operation",
                            content: { "application/json": { schema: { type: "boolean" } } },
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
