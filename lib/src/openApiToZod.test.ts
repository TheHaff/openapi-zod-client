import type { SchemaObject } from "openapi3-ts";
import { expect, test } from "vitest";
import { getZodSchema } from "./openApiToZod";
import type { CodeMetaData, ConversionTypeContext } from "./CodeMeta";
import { makeSchemaResolver } from "./makeSchemaResolver";
import { asComponentSchema } from "./utils";

const makeSchema = (schema: SchemaObject) => schema;
const getSchemaAsZodString = (schema: SchemaObject, meta?: CodeMetaData | undefined) =>
    getZodSchema({ schema: makeSchema(schema), meta }).toString();

test("getSchemaAsZodString", () => {
    expect(getSchemaAsZodString({ type: "null" })).toMatchInlineSnapshot('"z.null()"');
    expect(getSchemaAsZodString({ type: "null", enum: ["Dogs", "Cats", "Mice"] })).toMatchInlineSnapshot('"z.null()"');
    expect(getSchemaAsZodString({ type: "boolean" })).toMatchInlineSnapshot('"z.boolean()"');
    expect(getSchemaAsZodString({ type: "string" })).toMatchInlineSnapshot('"z.string()"');
    expect(getSchemaAsZodString({ type: "number" })).toMatchInlineSnapshot('"z.number()"');
    expect(getSchemaAsZodString({ type: "integer" })).toMatchInlineSnapshot('"z.int()"');
    // expect(getSchemaAsZodString({ type: "string", format: "date-time" })).toMatchInlineSnapshot('"z.string().datetime()"');
    // expect(getSchemaAsZodString({ type: "number", nullable: true, minimum: 0 })).toMatchInlineSnapshot('"z.number().nullable().gte(0)"');

    expect(getSchemaAsZodString({ type: "array", items: { type: "string" } })).toMatchInlineSnapshot(
        '"z.array(z.string())"'
    );
    expect(getSchemaAsZodString({ type: "object" })).toMatchInlineSnapshot('"z.looseObject({}).partial()"');
    expect(getSchemaAsZodString({ type: "object", properties: { str: { type: "string" } } })).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string() }).partial()"'
    );

    expect(getSchemaAsZodString({ type: "object", properties: { str: { type: "string" } } })).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string() }).partial()"'
    );

    expect(getSchemaAsZodString({ type: "object", properties: { nb: { type: "integer" } } })).toMatchInlineSnapshot(
        '"z.looseObject({ nb: z.int() }).partial()"'
    );

    expect(
        getSchemaAsZodString({ type: "object", properties: { pa: { type: "number", minimum: 0 } } })
    ).toMatchInlineSnapshot('"z.looseObject({ pa: z.number().gte(0) }).partial()"');

    expect(
        getSchemaAsZodString({ type: "object", properties: { pa: { type: "number", minimum: 0, maximum: 100 } } })
    ).toMatchInlineSnapshot('"z.looseObject({ pa: z.number().gte(0).lte(100) }).partial()"');

    expect(
        getSchemaAsZodString({ type: "object", properties: { ml: { type: "string", minLength: 0 } } })
    ).toMatchInlineSnapshot('"z.looseObject({ ml: z.string().min(0) }).partial()"');

    expect(
        getSchemaAsZodString({ type: "object", properties: { dt: { type: "string", format: "date-time" } } })
    ).toMatchInlineSnapshot('"z.looseObject({ dt: z.iso.datetime() }).partial()"');

    expect(
        getSchemaAsZodString({
            type: "object",
            properties: {
                str: { type: "string" },
                nb: { type: "number" },
                nested: {
                    type: "object",
                    properties: {
                        nested_prop: { type: "boolean" },
                    },
                },
            },
        })
    ).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string(), nb: z.number(), nested: z.looseObject({ nested_prop: z.boolean() }).partial() }).partial()"'
    );

    expect(
        getSchemaAsZodString({
            type: "array",
            items: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
        })
    ).toMatchInlineSnapshot('"z.array(z.looseObject({ str: z.string() }).partial())"');

    expect(
        getSchemaAsZodString({
            type: "array",
            items: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        })
    ).toMatchInlineSnapshot('"z.array(z.array(z.string()))"');

    expect(
        getSchemaAsZodString({
            type: "object",
            properties: {
                union: { oneOf: [{ type: "string" }, { type: "number" }] },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ union: z.union([z.string(), z.number()]) }).partial()"');

    expect(
        getSchemaAsZodString({
            type: "object",
            oneOf: [
                {
                    type: "object",
                    required: ["type", "a"],
                    properties: {
                        type: {
                            type: "string",
                            enum: ["a"],
                        },
                        a: {
                            type: "string",
                        },
                    },
                },
                {
                    type: "object",
                    required: ["type", "b"],
                    properties: {
                        type: {
                            type: "string",
                            enum: ["b"],
                        },
                        b: {
                            type: "string",
                        },
                    },
                },
            ],
            discriminator: { propertyName: "type" },
        })
    ).toMatchInlineSnapshot(`
      "
                      z.discriminatedUnion("type", [z.looseObject({ type: z.literal("a"), a: z.string() }), z.looseObject({ type: z.literal("b"), b: z.string() })])
                  "
    `);

    // returns z.discriminatedUnion, when allOf has single object
    expect(
        getSchemaAsZodString({
            type: "object",
            oneOf: [
                {
                    type: "object",
                    allOf: [
                        {
                            type: "object",
                            required: ["type", "a"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["a"],
                                },
                                a: {
                                    type: "string",
                                },
                            },
                        }
                    ]
                },
                {
                    type: "object",
                    allOf: [
                        {
                            type: "object",
                            required: ["type", "b"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["b"],
                                },
                                b: {
                                    type: "string",
                                },
                            },
                        },
                    ]
                }
            ],
            discriminator: { propertyName: "type" },

        })
    ).toMatchInlineSnapshot(`
      "
                      z.discriminatedUnion("type", [z.looseObject({ type: z.literal("a"), a: z.string() }), z.looseObject({ type: z.literal("b"), b: z.string() })])
                  "
    `);

    // returns z.union, when allOf has multiple objects
    expect(
        getSchemaAsZodString({
            type: "object",
            oneOf: [
                {
                    type: "object",
                    allOf: [
                        {
                            type: "object",
                            required: ["type", "a"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["a"],
                                },
                                a: {
                                    type: "string",
                                },
                            },
                        },
                        {
                            type: "object",
                            required: ["type", "c"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["c"],
                                },
                                c: {
                                    type: "string",
                                },
                            },
                        },
                    ]
                },
                {
                    type: "object",
                    allOf: [
                        {
                            type: "object",
                            required: ["type", "b"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["b"],
                                },
                                b: {
                                    type: "string",
                                },
                            },
                        },
                        {
                            type: "object",
                            required: ["type", "d"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["d"],
                                },
                                d: {
                                    type: "string",
                                },
                            },
                        },
                    ]
                }
            ],
            discriminator: { propertyName: "type" },

        })
    ).toMatchInlineSnapshot('"z.union([z.looseObject({ type: z.literal("a"), a: z.string() }).and(z.looseObject({ type: z.literal("c"), c: z.string() })), z.looseObject({ type: z.literal("b"), b: z.string() }).and(z.looseObject({ type: z.literal("d"), d: z.string() }))])"');

    expect(
        getSchemaAsZodString({
            type: "object",
            properties: {
                anyOfExample: { anyOf: [{ type: "string" }, { type: "number" }] },
            },
        })
    ).toMatchInlineSnapshot(
        '"z.looseObject({ anyOfExample: z.union([z.string(), z.number()]) }).partial()"'
    );

    expect(
        getSchemaAsZodString({
            type: "object",
            properties: {
                intersection: { allOf: [{ type: "string" }, { type: "number" }] },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ intersection: z.string().and(z.number()) }).partial()"');

    expect(getSchemaAsZodString({ type: "string", enum: ["aaa", "bbb", "ccc"] })).toMatchInlineSnapshot(
        '"z.enum(["aaa", "bbb", "ccc"])"'
    );
    expect(getSchemaAsZodString({ type: "number", enum: [1, 2, 3, null] })).toMatchInlineSnapshot(
        '"z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(null)])"'
    );
    expect(getSchemaAsZodString({ type: "number", enum: [1] })).toMatchInlineSnapshot('"z.literal(1)"');
    expect(getSchemaAsZodString({ type: "string", enum: ["aString"] })).toMatchInlineSnapshot('"z.literal("aString")"');
});

test("getSchemaWithChainableAsZodString", () => {
    expect(getSchemaAsZodString({ type: "string", nullable: true })).toMatchInlineSnapshot('"z.string()"');
    expect(getSchemaAsZodString({ type: "string", nullable: false })).toMatchInlineSnapshot('"z.string()"');

    expect(getSchemaAsZodString({ type: "string", nullable: false }, { isRequired: true })).toMatchInlineSnapshot(
        '"z.string()"'
    );
    expect(getSchemaAsZodString({ type: "string", nullable: true }, { isRequired: true })).toMatchInlineSnapshot(
        '"z.string()"'
    );
});

test("CodeMeta with missing ref", () => {
    const ctx: ConversionTypeContext = {
        resolver: makeSchemaResolver({ components: { schemas: {} } } as any),
        zodSchemaByName: {},
        schemaByName: {},
    };

    expect(() =>
        getZodSchema({
            schema: makeSchema({
                type: "object",
                properties: {
                    str: { type: "string" },
                    reference: {
                        $ref: "Example",
                    },
                    inline: {
                        type: "object",
                        properties: {
                            nested_prop: { type: "boolean" },
                        },
                    },
                },
            }),
            ctx,
        })
    ).toThrowErrorMatchingInlineSnapshot('"Schema Example not found"');
});

test("CodeMeta with ref", () => {
    const schemas = {
        Example: {
            type: "object",
            properties: {
                exampleProp: { type: "string" },
                another: { type: "number" },
            },
        },
    } as Record<string, SchemaObject>;
    const ctx: ConversionTypeContext = {
        resolver: makeSchemaResolver({ components: { schemas } } as any),
        zodSchemaByName: {},
        schemaByName: {},
    };
    Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));

    const code = getZodSchema({
        schema: makeSchema({
            type: "object",
            properties: {
                str: { type: "string" },
                reference: {
                    $ref: "#/components/schemas/Example",
                },
                inline: {
                    type: "object",
                    properties: {
                        nested_prop: { type: "boolean" },
                    },
                },
            },
        }),
        ctx,
    });
    expect(code.toString()).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string(), reference: Example, inline: z.looseObject({ nested_prop: z.boolean() }).partial() }).partial()"'
    );
    expect(code.children).toMatchInlineSnapshot(`
      [
          "z.string()",
          "Example",
          "z.looseObject({ nested_prop: z.boolean() }).partial()",
      ]
    `);
});

test("CodeMeta with nested refs", () => {
    const schemas = {
        Basic: { type: "object", properties: { prop: { type: "string" }, second: { type: "number" } } },
        WithNested: {
            type: "object",
            properties: { nested: { type: "string" }, nestedRef: { $ref: "#/components/schemas/DeepNested" } },
        },
        ObjectWithArrayOfRef: {
            type: "object",
            properties: {
                exampleProp: { type: "string" },
                another: { type: "number" },
                link: { type: "array", items: { $ref: "#/components/schemas/WithNested" } },
                someReference: { $ref: "#/components/schemas/Basic" },
            },
        },
        DeepNested: { type: "object", properties: { deep: { type: "boolean" } } },
    } as Record<string, SchemaObject>;
    const ctx: ConversionTypeContext = {
        resolver: makeSchemaResolver({ components: { schemas } } as any),
        zodSchemaByName: {},
        schemaByName: {},
    };
    Object.keys(schemas).forEach((key) => ctx.resolver.getSchemaByRef(asComponentSchema(key)));

    const code = getZodSchema({
        schema: makeSchema({
            type: "object",
            properties: {
                str: { type: "string" },
                reference: {
                    $ref: "#/components/schemas/ObjectWithArrayOfRef",
                },
                inline: {
                    type: "object",
                    properties: {
                        nested_prop: { type: "boolean" },
                    },
                },
                another: { $ref: "#components/schemas/WithNested" },
                basic: { $ref: "#/components/schemas/Basic" },
                differentPropSameRef: { $ref: "#/components/schemas/Basic" },
            },
        }),
        ctx,
    });
    expect(code.toString()).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string(), reference: ObjectWithArrayOfRef, inline: z.looseObject({ nested_prop: z.boolean() }).partial(), another: WithNested, basic: Basic, differentPropSameRef: Basic }).partial()"'
    );
    expect(code.children).toMatchInlineSnapshot(`
      [
          "z.string()",
          "ObjectWithArrayOfRef",
          "z.looseObject({ nested_prop: z.boolean() }).partial()",
          "WithNested",
          "Basic",
          "Basic",
      ]
    `);
    expect(ctx).toMatchInlineSnapshot(`
      {
          "resolver": {
              "getSchemaByRef": [Function],
              "resolveRef": [Function],
              "resolveSchemaName": [Function],
          },
          "schemaByName": {},
          "zodSchemaByName": {
              "Basic": "z.looseObject({ prop: z.string(), second: z.number() }).partial()",
              "DeepNested": "z.looseObject({ deep: z.boolean() }).partial()",
              "ObjectWithArrayOfRef": "z.looseObject({ exampleProp: z.string(), another: z.number(), link: z.array(WithNested), someReference: Basic }).partial()",
              "WithNested": "z.looseObject({ nested: z.string(), nestedRef: DeepNested }).partial()",
          },
      }
    `);
});
