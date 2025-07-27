import { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("same-schema-different-name", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/same-schema-different-name": {
                put: {
                    operationId: "putSameSchemaDifferentName",
                    responses: {
                        "200": {
                            content: {
                                "application/json": {
                                    schema: { type: "string" },
                                },
                            },
                        },
                    },
                    parameters: [
                        {
                            name: "sameSchemaDifferentName",
                            in: "query",
                            schema: { type: "string", enum: ["aaa", "bbb", "ccc"] },
                        },
                    ],
                },
                post: {
                    operationId: "postSameSchemaDifferentName",
                    responses: {
                        "200": {
                            content: {
                                "application/json": {
                                    schema: { type: "string" },
                                },
                            },
                        },
                    },
                    parameters: [
                        {
                            name: "differentNameSameSchema",
                            in: "query",
                            schema: { type: "string", enum: ["aaa", "bbb", "ccc"] },
                        },
                        {
                            name: "anotherDifferentNameWithSlightlyDifferentSchema",
                            in: "query",
                            schema: { type: "string", enum: ["aaa", "bbb", "ccc"], default: "aaa" },
                        },
                    ],
                },
            },
        },
    };
    const ctx = getZodClientTemplateContext(openApiDoc, { complexityThreshold: 2 });
    expect(ctx).toMatchInlineSnapshot(`
      {
          "circularTypeByName": {},
          "emittedType": {},
          "options": {},
          "schemas": {},
          "types": {},
      }
    `);

    const result = await generateZodClientFromOpenAPI({
        disableWriteToFile: true,
        openApiDoc,
        options: { complexityThreshold: 2 },
    });
    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
