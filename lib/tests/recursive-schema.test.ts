import type { SchemaObject, SchemasObject } from "openapi3-ts";
import { describe, expect, test } from "vitest";
import {
    getOpenApiDependencyGraph,
    getZodClientTemplateContext,
    getZodSchema,
} from "../src";
import { generateZodClientFromOpenAPI } from "../src/generateZodClientFromOpenAPI";
import { topologicalSort } from "../src/topologicalSort";
import type { ConversionTypeContext } from "../src/CodeMeta";
import { makeSchemaResolver } from "../src/makeSchemaResolver";
import { asComponentSchema } from "../src/utils";

// TODO recursive inline response/param ?

const makeOpenApiDoc = (schemas: SchemasObject, responseSchema: SchemaObject) => ({
    openapi: "3.0.3",
    info: { title: "Swagger Petstore - OpenAPI 3.0", version: "1.0.11" },
    paths: {
        "/example": {
            get: {
                operationId: "getExample",
                responses: {
                    "200": { description: "OK", content: { "application/json": { schema: responseSchema } } },
                },
            },
        },
    },
    components: { schemas },
});

describe("recursive-schema", () => {
    const UserSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            parent: { $ref: "#/components/schemas/User" },
        },
    } as SchemaObject;

    test("indirect single recursive", async () => {
        const schemas = {
            User: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    middle: { $ref: "#/components/schemas/Middle" },
                },
            },
            Middle: {
                type: "object",
                properties: {
                    user: { $ref: "#/components/schemas/User" },
                },
            },
            Root: {
                type: "object",
                properties: {
                    recursive: {
                        $ref: "#/components/schemas/User",
                    },
                    basic: { type: "number" },
                },
            },
        } as SchemasObject;
        const ctx: ConversionTypeContext = {
            zodSchemaByName: {},
            schemaByName: {},
            resolver: makeSchemaResolver({ components: { schemas } } as any),
        };
        Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));
        expect(getZodSchema({ schema: schemas['Root']!, ctx })).toMatchInlineSnapshot(
            '"z.looseObject({ recursive: User, basic: z.number() }).partial()"'
        );
        expect(ctx).toMatchInlineSnapshot(`
          {
              "resolver": {
                  "getSchemaByRef": [Function],
                  "resolveRef": [Function],
                  "resolveSchemaName": [Function],
              },
              "schemaByName": {},
              "zodSchemaByName": {
                  "Middle": "z.looseObject({ user: User }).partial()",
                  "User": "z.looseObject({ name: z.string(), middle: Middle }).partial()",
              },
          }
        `);

        const openApiDoc = makeOpenApiDoc(schemas, schemas['Root']!);
        const depsGraph = getOpenApiDependencyGraph(
            Object.keys(ctx.zodSchemaByName).map((name) => asComponentSchema(name)),
            ctx.resolver.getSchemaByRef
        );
        expect(depsGraph).toMatchInlineSnapshot(`
          {
              "deepDependencyGraph": {
                  "#/components/schemas/Middle": Set {
                      "#/components/schemas/User",
                      "#/components/schemas/Middle",
                  },
                  "#/components/schemas/User": Set {
                      "#/components/schemas/Middle",
                      "#/components/schemas/User",
                  },
              },
              "refsDependencyGraph": {
                  "#/components/schemas/Middle": Set {
                      "#/components/schemas/User",
                  },
                  "#/components/schemas/User": Set {
                      "#/components/schemas/Middle",
                  },
              },
          }
        `);

        expect(topologicalSort(depsGraph.refsDependencyGraph)).toMatchInlineSnapshot(`
          [
              "#/components/schemas/User",
              "#/components/schemas/Middle",
          ]
        `);

        const prettyOutput = await generateZodClientFromOpenAPI({ openApiDoc, disableWriteToFile: true });
        expect(prettyOutput).toMatchInlineSnapshot(`
          "import { z } from "zod";

          type User = Partial<{
            name: string;
            middle: Middle;
          }>;
          type Middle = Partial<{
            user: User;
          }>;
          "
        `);
    });

    const ObjectWithRecursiveArray = {
        type: "object",
        properties: {
            isInsideObjectWithRecursiveArray: { type: "boolean" },
            array: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/ObjectWithRecursiveArray",
                },
            },
        },
    } as SchemaObject;
    const schemas2 = { ObjectWithRecursiveArray };
    const ResponseSchema = {
        type: "object",
        properties: {
            recursiveRef: {
                $ref: "#/components/schemas/ObjectWithRecursiveArray",
            },
            basic: { type: "number" },
        },
    } as SchemaObject;

    test("recursive array", () => {
        const ctx: ConversionTypeContext = {
            zodSchemaByName: {},
            schemaByName: {},
            resolver: makeSchemaResolver({ components: { schemas } } as any),
        };
        Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));
        expect(getZodSchema({ schema: ResponseSchema, ctx })).toMatchInlineSnapshot(
            '"z.looseObject({ recursiveRef: ObjectWithRecursiveArray, basic: z.number() }).partial()"'
        );
        expect(ctx).toMatchInlineSnapshot(`
          {
              "resolver": {
                  "getSchemaByRef": [Function],
                  "resolveRef": [Function],
                  "resolveSchemaName": [Function],
              },
              "schemaByName": {},
              "zodSchemaByName": {
                  "ObjectWithRecursiveArray": "z.looseObject({ isInsideObjectWithRecursiveArray: z.boolean(), array: z.array(ObjectWithRecursiveArray) }).partial()",
              },
          }
        `);


    });

    test("direct recursive", () => {
        const ctx: ConversionTypeContext = {
            zodSchemaByName: {},
            schemaByName: {},
            resolver: makeSchemaResolver({ components: { schemas } } as any),
        };
        Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));
        expect(getZodSchema({ schema: UserSchema, ctx })).toMatchInlineSnapshot(
            '"z.looseObject({ name: z.string(), parent: User }).partial()"'
        );
        expect(ctx).toMatchInlineSnapshot(`
          {
              "resolver": {
                  "getSchemaByRef": [Function],
                  "resolveRef": [Function],
                  "resolveSchemaName": [Function],
              },
              "schemaByName": {},
              "zodSchemaByName": {
                  "User": "z.looseObject({ name: z.string(), parent: User }).partial()",
              },
          }
        `);
    });

    const UserWithFriends = {
        type: "object",
        properties: {
            name: { type: "string" },
            parent: { $ref: "#/components/schemas/UserWithFriends" },
            friends: { type: "array", items: { $ref: "#/components/schemas/Friend" } },
            bestFriend: { $ref: "#/components/schemas/Friend" },
        },
    } as SchemaObject;

    const Friend = {
        type: "object",
        properties: {
            nickname: { type: "string" },
            user: { $ref: "#/components/schemas/UserWithFriends" },
            circle: { type: "array", items: { $ref: "#/components/schemas/Friend" } },
        },
    } as SchemaObject;
    const schemas = { User: UserSchema, UserWithFriends, Friend, ResponseSchema, ObjectWithRecursiveArray };

    test("multiple recursive in one root schema", async () => {
        const ctx: ConversionTypeContext = {
            zodSchemaByName: {},
            schemaByName: {},
            resolver: makeSchemaResolver({ components: { schemas } } as any),
        };
        Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));
        expect(
            getZodSchema({
                schema: {
                    type: "object",
                    properties: {
                        recursiveUser: {
                            $ref: "#/components/schemas/UserWithFriends",
                        },
                        basic: { type: "number" },
                    },
                },
                ctx,
            })
        ).toMatchInlineSnapshot('"z.looseObject({ recursiveUser: UserWithFriends, basic: z.number() }).partial()"');
        expect(ctx).toMatchInlineSnapshot(`
          {
              "resolver": {
                  "getSchemaByRef": [Function],
                  "resolveRef": [Function],
                  "resolveSchemaName": [Function],
              },
              "schemaByName": {},
              "zodSchemaByName": {
                  "Friend": "z.looseObject({ nickname: z.string(), user: UserWithFriends, circle: z.array(Friend) }).partial()",
                  "UserWithFriends": "z.looseObject({ name: z.string(), parent: UserWithFriends, friends: z.array(Friend), bestFriend: Friend }).partial()",
              },
          }
        `);

        const openApiDoc = makeOpenApiDoc(schemas, {
            type: "object",
            properties: {
                someUser: {
                    $ref: "#/components/schemas/UserWithFriends",
                },
                someProp: { type: "boolean" },
            },
        });



        const templateCtx = getZodClientTemplateContext(openApiDoc);
        expect(templateCtx).toMatchInlineSnapshot(`
          {
              "circularTypeByName": {},
              "emittedType": {
                  "Friend": true,
                  "ObjectWithRecursiveArray": true,
                  "User": true,
                  "UserWithFriends": true,
              },
              "options": {},
              "schemas": {},
              "types": {
                  "Friend": "type Friend = Partial<{
              nickname: string;
              user: UserWithFriends;
              circle: Array<Friend>;
          }>;",
                  "ObjectWithRecursiveArray": "type ObjectWithRecursiveArray = Partial<{
              isInsideObjectWithRecursiveArray: boolean;
              array: Array<ObjectWithRecursiveArray>;
          }>;",
                  "User": "type User = Partial<{
              name: string;
              parent: User;
          }>;",
                  "UserWithFriends": "type UserWithFriends = Partial<{
              name: string;
              parent: UserWithFriends;
              friends: Array<Friend>;
              bestFriend: Friend;
          }>;",
              },
          }
        `);

        const prettyOutput = await generateZodClientFromOpenAPI({ openApiDoc, disableWriteToFile: true });
        expect(prettyOutput).toMatchInlineSnapshot(`
          "import { z } from "zod";

          type User = Partial<{
            name: string;
            parent: User;
          }>;
          type UserWithFriends = Partial<{
            name: string;
            parent: UserWithFriends;
            friends: Array<Friend>;
            bestFriend: Friend;
          }>;
          type Friend = Partial<{
            nickname: string;
            user: UserWithFriends;
            circle: Array<Friend>;
          }>;
          type ObjectWithRecursiveArray = Partial<{
            isInsideObjectWithRecursiveArray: boolean;
            array: Array<ObjectWithRecursiveArray>;
          }>;
          "
        `);
    });

    test("recursive schema with $ref to another simple schema should still generate and output that simple schema and its dependencies", async () => {
        const Playlist = {
            type: "object",
            properties: {
                name: { type: "string" },
                author: { $ref: "#/components/schemas/Author" },
                songs: { type: "array", items: { $ref: "#/components/schemas/Song" } },
            },
        } as SchemaObject;

        const Song = {
            type: "object",
            properties: {
                name: { type: "string" },
                duration: { type: "number" },
                in_playlists: { type: "array", items: { $ref: "#/components/schemas/Playlist" } },
            },
        } as SchemaObject;

        const Author = {
            type: "object",
            properties: {
                name: { type: "string" },
                mail: { type: "string" },
                settings: { $ref: "#/components/schemas/Settings" },
            },
        } as SchemaObject;
        const Settings = {
            type: "object",
            properties: {
                theme_color: { type: "string" },
            },
        } as SchemaObject;
        const schemas = { Playlist, Song, Author, Settings };

        const ctx: ConversionTypeContext = {
            zodSchemaByName: {},
            schemaByName: {},
            resolver: makeSchemaResolver({ components: { schemas } } as any),
        };
        Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));

        const RootSchema = {
            type: "object",
            properties: {
                playlist: { $ref: "#/components/schemas/Playlist" },
                by_author: { $ref: "#/components/schemas/Author" },
            },
        } as SchemaObject;
        expect(getZodSchema({ schema: RootSchema, ctx })).toMatchInlineSnapshot(
            '"z.looseObject({ playlist: Playlist, by_author: Author }).partial()"'
        );
        expect(ctx).toMatchInlineSnapshot(`
          {
              "resolver": {
                  "getSchemaByRef": [Function],
                  "resolveRef": [Function],
                  "resolveSchemaName": [Function],
              },
              "schemaByName": {},
              "zodSchemaByName": {
                  "Author": "z.looseObject({ name: z.string(), mail: z.string(), settings: Settings }).partial()",
                  "Playlist": "z.looseObject({ name: z.string(), author: Author, songs: z.array(Song) }).partial()",
                  "Settings": "z.looseObject({ theme_color: z.string() }).partial()",
                  "Song": "z.looseObject({ name: z.string(), duration: z.number(), in_playlists: z.array(Playlist) }).partial()",
              },
          }
        `);

        const openApiDoc = makeOpenApiDoc(schemas, RootSchema);
        const prettyOutput = await generateZodClientFromOpenAPI({ openApiDoc, disableWriteToFile: true });
        expect(prettyOutput).toMatchInlineSnapshot(`
          "import { z } from "zod";

          type Playlist = Partial<{
            name: string;
            author: Author;
            songs: Array<Song>;
          }>;
          type Author = Partial<{
            name: string;
            mail: string;
            settings: Settings;
          }>;
          type Settings = Partial<{
            theme_color: string;
          }>;
          type Song = Partial<{
            name: string;
            duration: number;
            in_playlists: Array<Playlist>;
          }>;
          "
        `);
    });
});
