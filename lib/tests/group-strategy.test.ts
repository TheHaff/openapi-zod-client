import { OpenAPIObject, SchemaObject } from "openapi3-ts";
import SwaggerParser from "@apidevtools/swagger-parser";
import { expect, test } from "vitest";
import { generateZodClientFromOpenAPI, getZodClientTemplateContext } from "../src";

test("group-strategy", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        paths: {
            "/pet": {
                get: {
                    operationId: "petGet",
                    tags: ["pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "petPut",
                    tags: ["pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
            "/pet/all": {
                get: {
                    operationId: "petAllGet",
                    tags: ["pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "petAllPut",
                    tags: ["pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
            "/store": {
                get: {
                    operationId: "storeGet",
                    tags: ["store"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "storePut",
                    tags: ["store"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
            "/user": {
                get: {
                    operationId: "userGet",
                    tags: ["user"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "userPut",
                    tags: ["user"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
            "/user/pets": {
                get: {
                    operationId: "userGet",
                    tags: ["user", "pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "userPut",
                    tags: ["user", "pet"],
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
            "/no-tags": {
                get: {
                    operationId: "noTagsGet",
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
                put: {
                    operationId: "noTagsPut",
                    responses: { "200": { content: { "application/json": { schema: { type: "string" } } } } },
                },
            },
        },
    };

    const ctxByTag = getZodClientTemplateContext(openApiDoc, { groupStrategy: "tag" });
    expect(ctxByTag.endpointsGroups).toMatchInlineSnapshot('undefined');

    const resultGroupedByTag = await generateZodClientFromOpenAPI({
        openApiDoc,
        disableWriteToFile: true,
        options: { groupStrategy: "tag" },
    });
    expect(resultGroupedByTag).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);

    const ctxByMethod = getZodClientTemplateContext(openApiDoc, { groupStrategy: "method" });
    expect(ctxByMethod.endpointsGroups).toMatchInlineSnapshot('undefined');

    const resultGroupedByMethod = await generateZodClientFromOpenAPI({
        openApiDoc,
        disableWriteToFile: true,
        options: { groupStrategy: "method" },
    });

    expect(resultGroupedByMethod).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});

test("group-strategy: tag-file with modified petstore schema", async () => {
    const openApiDoc = (await SwaggerParser.parse("./tests/petstore.yaml")) as OpenAPIObject;
    // Add `Pet` object into `Order`.
    const orderObject = openApiDoc.components!.schemas!.Order as SchemaObject;
    orderObject!.properties!.pet = {
        $ref: "#/components/schemas/Pet",
    };

    const result = await generateZodClientFromOpenAPI({
        openApiDoc,
        disableWriteToFile: true,
        options: { groupStrategy: "tag-file" },
    });

    expect(result).toMatchInlineSnapshot(`
      "import { z } from "zod";
      "
    `);
});

test("group-strategy with complex schemas + split files", async () => {
    const openApiDoc: OpenAPIObject = {
        openapi: "3.0.3",
        info: { version: "1", title: "Example API" },
        components: {
            schemas: {
                Pet: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        nickname: { type: "string" },
                        owner: { $ref: "#/components/schemas/User" },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        firstname: { type: "string" },
                        lastname: { type: "string" },
                        email: { type: "string" },
                        friends: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    },
                },
                Store: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        address: { type: "string" },
                        country: { $ref: "#/components/schemas/Country" },
                        owner: { $ref: "#/components/schemas/User" },
                    },
                },
                Country: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        code: { type: "string" },
                        store_list: { type: "array", items: { $ref: "#/components/schemas/Store" } },
                    },
                },
            },
        },
        paths: {
            "/pet": {
                get: {
                    operationId: "petGet",
                    tags: ["pet"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } },
                    },
                },
                put: {
                    operationId: "petPut",
                    tags: ["pet"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } },
                    },
                },
            },
            "/pet/all": {
                get: {
                    operationId: "petAllGet",
                    tags: ["pet"],
                    responses: {
                        "200": {
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Pet" } },
                                },
                            },
                        },
                    },
                },
                post: {
                    operationId: "petAllPost",
                    tags: ["pet"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } },
                    },
                },
            },
            "/user": {
                get: {
                    operationId: "userGet",
                    tags: ["user"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
                    },
                },
                put: {
                    operationId: "userPut",
                    tags: ["user"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
                    },
                },
            },
            "/store": {
                get: {
                    operationId: "storeGet",
                    tags: ["store"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Store" } } } },
                    },
                },
                put: {
                    operationId: "storePut",
                    tags: ["store"],
                    responses: {
                        "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Store" } } } },
                    },
                },
            },
            "/countries": {
                get: {
                    operationId: "noTagsGet",
                    responses: {
                        "200": {
                            content: { "application/json": { schema: { $ref: "#/components/schemas/Country" } } },
                        },
                    },
                },
            },
        },
    };

    const ctxByTag = getZodClientTemplateContext(openApiDoc, { groupStrategy: "tag-file" });
    expect(ctxByTag.endpointsGroups).toMatchInlineSnapshot('undefined');

    const resultGroupedByTagSplitByFiles = await generateZodClientFromOpenAPI({
        openApiDoc,
        disableWriteToFile: true,
        options: { groupStrategy: "tag-file" },
    });

    expect(resultGroupedByTagSplitByFiles).toMatchInlineSnapshot(`
      "import { z } from "zod";

      type User = Partial<{
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        friends: Array<User>;
      }>;
      type Store = Partial<{
        id: number;
        name: string;
        address: string;
        country: Country;
        owner: User;
      }>;
      type Country = Partial<{
        id: number;
        name: string;
        code: string;
        store_list: Array<Store>;
      }>;
      "
    `);
});
