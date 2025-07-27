import { OpenAPIObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("export-all-named-schemas", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/export-all-named-schemas": {
                get: {
                    operationId: "getSchemaNameAlreadyUsed",
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
                            name: "sameSchemaSameName",
                            in: "query",
                            schema: { type: "string", enum: ["xxx", "yyy", "zzz"] },
                        },
                    ],
                },
                put: {
                    operationId: "putSchemaNameAlreadyUsed",
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
                            name: "schemaNameAlreadyUsed",
                            in: "query",
                            schema: { type: "string", enum: ["aaa", "bbb", "ccc"] },
                        },
                    ],
                },
                delete: {
                    operationId: "deleteSchemaNameAlreadyUsed",
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
                            schema: { type: "string", enum: ["xxx", "yyy", "zzz"] },
                        },
                        {
                            name: "sameSchemaSameName",
                            in: "query",
                            schema: { type: "string", enum: ["xxx", "yyy", "zzz"] },
                        },
                    ],
                },
                post: {
                    operationId: "postSchemaNameAlreadyUsed",
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
                            name: "schemaNameAlreadyUsed",
                            in: "query",
                            schema: { type: "string", enum: ["ggg", "hhh", "iii"] },
                        },
                    ],
                },
            },
        },
    };
    const ctx = getZodClientTemplateContext(openApiDoc, { complexityThreshold: 2, exportAllNamedSchemas: true });
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
        options: { complexityThreshold: 2, exportAllNamedSchemas: true },
    });

    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});
