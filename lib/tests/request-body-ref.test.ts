import type { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src";

// https://github.com/astahmer/openapi-zod-client/issues/122
test("request-body-ref", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: {
            title: "Pets",
            version: "1.0.0",
        },
        paths: {
            "/pets": {
                post: {
                    summary: "Post pets.",
                    operationId: "PostPets",
                    requestBody: {
                        $ref: "#/components/requestBodies/PostPetsRequest",
                    },
                    responses: {},
                },
            },
        },
        components: {
            schemas: {
                PostPetsRequest: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                    },
                },
            },
            requestBodies: {
                PostPetsRequest: {
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/PostPetsRequest",
                            },
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
