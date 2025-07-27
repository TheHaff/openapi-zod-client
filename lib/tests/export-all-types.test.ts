import type { SchemaObject, SchemasObject } from "openapi3-ts";
import { describe, expect, test } from "vitest";
import { generateZodClientFromOpenAPI } from "../src/generateZodClientFromOpenAPI";
import { getZodClientTemplateContext } from "../src/template-context";

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

describe("export-all-types", () => {
    test("shouldExportAllTypes option, non-circular types are exported", async () => {
        const Playlist = {
            allOf: [
                {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        author: { $ref: "#/components/schemas/Author" },
                        songs: { type: "array", items: { $ref: "#/components/schemas/Song" } },
                    },
                },
                {
                    $ref: "#/components/schemas/Settings",
                },
            ],
        } as SchemaObject;

        const Song = {
            type: "object",
            properties: {
                name: { type: "string" },
                duration: { type: "number" },
            },
        } as SchemaObject;

        const Title = {
            type: "string",
            minLength: 1,
            maxLength: 30,
        } as SchemaObject;

        const Id = {
            type: "number",
        } as SchemaObject;

        const Features = {
            type: "array",
            items: {
                type: "string",
            },
            minItems: 1,
        } as SchemaObject;

        const Author = {
            type: "object",
            properties: {
                name: { nullable: true, oneOf: [{ type: "string", nullable: true }, { type: "number" }] },
                title: {
                    $ref: "#/components/schemas/Title",
                },
                id: {
                    $ref: "#/components/schemas/Id",
                },
                mail: { type: "string" },
                settings: { $ref: "#/components/schemas/Settings" },
            },
        } as SchemaObject;

        const Settings = {
            type: "object",
            properties: {
                theme_color: { type: "string" },
                features: {
                    $ref: "#/components/schemas/Features",
                },
            },
        } as SchemaObject;
        const schemas = { Playlist, Song, Author, Settings, Title, Id, Features };

        const RootSchema = {
            type: "object",
            properties: {
                playlist: { $ref: "#/components/schemas/Playlist" },
                by_author: { $ref: "#/components/schemas/Author" },
            },
        } as SchemaObject;

        const openApiDoc = makeOpenApiDoc(schemas, RootSchema);

        const data = getZodClientTemplateContext(openApiDoc, { shouldExportAllTypes: true });

        expect(data).toEqual({
            schemas: {},
            types: {
                Author: `type Author = Partial<{
    name: (string | null) | number | null;
    title: Title;
    id: Id;
    mail: string;
    settings: Settings;
}>;`,
                Playlist: `type Playlist = Partial<{
    name: string;
    author: Author;
    songs: Array<Song>;
}> & Settings;`,
                Settings: `type Settings = Partial<{
    theme_color: string;
    features: Features;
}>;`,
                Song: `type Song = Partial<{
    name: string;
    duration: number;
}>;`,
                Features: "type Features = Array<string>;",
                Id: "type Id = number;",
                Title: "type Title = string;",
            },
            circularTypeByName: {},
            emittedType: {
                Author: true,
                Settings: true,
                Playlist: true,
                Song: true,
            },
            options: {},
        });

        const prettyOutput = await generateZodClientFromOpenAPI({
            openApiDoc,
            disableWriteToFile: true,
            options: {
                shouldExportAllTypes: true,
            },
        });
        expect(prettyOutput).toMatchInlineSnapshot(`
          "import { z } from "zod";

          type Playlist = Partial<{
            name: string;
            author: Author;
            songs: Array<Song>;
          }> &
            Settings;
          type Author = Partial<{
            name: (string | null) | number | null;
            title: Title;
            id: Id;
            mail: string;
            settings: Settings;
          }>;
          type Title = string;
          type Id = number;
          type Settings = Partial<{
            theme_color: string;
            features: Features;
          }>;
          type Features = Array<string>;
          type Song = Partial<{
            name: string;
            duration: number;
          }>;
          "
        `);
    });
});
