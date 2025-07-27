import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("validations", () => {
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                    strWithLength: { type: "string", minLength: 3, maxLength: 3 },
                    strWithMin: { type: "string", minLength: 3 },
                    strWithMax: { type: "string", maxLength: 3 },
                    strWithPattern: { type: "string", pattern: "/^[a-z]+$/" },
                    strWithPatternWithSlash: { type: "string", pattern: "/abc/def/ghi/" },
                    email: { type: "string", format: "email" },
                    hostname: { type: "string", format: "hostname" },
                    url: { type: "string", format: "uri" },
                    uuid: { type: "string", format: "uuid" },
                    date: { type: "string", format: "date" },
                    time: { type: "string", format: "time" },
                    uriReference: { type: "string", format: "uri-reference" },
                    emoji: { type: "string", format: "emoji" },
                    base64: { type: "string", format: "base64" },
                    base64url: { type: "string", format: "base64url" },
                    nanoid: { type: "string", format: "nanoid" },
                    cuid: { type: "string", format: "cuid" },
                    cuid2: { type: "string", format: "cuid2" },
                    ulid: { type: "string", format: "ulid" },
                    ipv4: { type: "string", format: "ipv4" },
                    ipv6: { type: "string", format: "ipv6" },
                    cidrv4: { type: "string", format: "cidrv4" },
                    cidrv6: { type: "string", format: "cidrv6" },
                    duration: { type: "string", format: "duration" },
                    //
                    number: { type: "number" },
                    int: { type: "integer" },
                    intWithMin: { type: "integer", minimum: 3 },
                    intWithMax: { type: "integer", maximum: 3 },
                    intWithMinAndMax: { type: "integer", minimum: 3, maximum: 3 },
                    intWithExclusiveMinTrue: { type: "integer", minimum: 3, exclusiveMinimum: true },
                    intWithExclusiveMinFalse: { type: "integer", minimum: 3, exclusiveMinimum: false },
                    intWithExclusiveMin: { type: "integer", exclusiveMinimum: 3 },
                    intWithExclusiveMaxTrue: { type: "integer", maximum: 3, exclusiveMaximum: true },
                    intWithExclusiveMaxFalse: { type: "integer", maximum: 3, exclusiveMaximum: false },
                    intWithExclusiveMax: { type: "integer", exclusiveMaximum: 3 },
                    intWithMultipleOf: { type: "integer", multipleOf: 3 },
                    //
                    bool: { type: "boolean" },
                    //
                    array: { type: "array", items: { type: "string" } },
                    arrayWithMin: { type: "array", items: { type: "string" }, minItems: 3 },
                    arrayWithMax: { type: "array", items: { type: "string" }, maxItems: 3 },
                    arrayWithFormat: { type: "array", items: { type: "string", format: "uuid" } },
                    // TODO ?
                    // arrayWithUnique: { type: "array", items: { type: "string" }, uniqueItems: true },
                    //
                    object: { type: "object", properties: { str: { type: "string" } } },
                    objectWithRequired: { type: "object", properties: { str: { type: "string" } }, required: ["str"] },
                    // TODO ?
                    // objectWithMin: { type: "object", properties: { str: { type: "string" } }, minProperties: 3 },
                    // objectWithMax: { type: "object", properties: { str: { type: "string" } }, maxProperties: 3 },
                    //
                    oneOf: { oneOf: [{ type: "string" }, { type: "number" }] },
                    anyOf: { anyOf: [{ type: "string" }, { type: "number" }] },
                    allOf: { allOf: [{ type: "string" }, { type: "number" }] },
                    nested: {
                        additionalProperties: { type: "number" },
                    },
                    nestedNullable: {
                        additionalProperties: { type: "number", nullable: true },
                    },
                },
            },
            options: {
                withImplicitRequiredProps: true,
            },
        })
    ).toMatchInlineSnapshot(
        '"z.looseObject({ str: z.string(), strWithLength: z.string().min(3).max(3), strWithMin: z.string().min(3), strWithMax: z.string().max(3), strWithPattern: z.string().regex(/^[a-z]+$/), strWithPatternWithSlash: z.string().regex(/abc\\/def\\/ghi/), email: z.email(), hostname: z.url(), url: z.url(), uuid: z.uuid(), date: z.iso.date(), time: z.iso.time(), uriReference: z.url(), emoji: z.emoji(), base64: z.base64(), base64url: z.base64url(), nanoid: z.nanoid(), cuid: z.cuid(), cuid2: z.cuid2(), ulid: z.ulid(), ipv4: z.ipv4(), ipv6: z.ipv6(), cidrv4: z.cidrv4(), cidrv6: z.cidrv6(), duration: z.iso.duration(), number: z.number(), int: z.int(), intWithMin: z.int().gte(3), intWithMax: z.int().lte(3), intWithMinAndMax: z.int().gte(3).lte(3), intWithExclusiveMinTrue: z.int().gt(3), intWithExclusiveMinFalse: z.int().gte(3), intWithExclusiveMin: z.int().gt(3), intWithExclusiveMaxTrue: z.int().lt(3), intWithExclusiveMaxFalse: z.int().lte(3), intWithExclusiveMax: z.int().lt(3), intWithMultipleOf: z.int().multipleOf(3), bool: z.boolean(), array: z.array(z.string()), arrayWithMin: z.array(z.string()).min(3), arrayWithMax: z.array(z.string()).max(3), arrayWithFormat: z.array(z.uuid()), object: z.looseObject({ str: z.string() }), objectWithRequired: z.looseObject({ str: z.string() }), oneOf: z.union([z.string(), z.number()]), anyOf: z.union([z.string(), z.number()]), allOf: z.string().and(z.number()), nested: z.record(z.number()), nestedNullable: z.record(z.number().nullable()) })"'
    );
});

test("openapi string formats", () => {
    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "email",
            },
        })
    ).toMatchInlineSnapshot('"z.email()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "uri",
            },
        })
    ).toMatchInlineSnapshot('"z.url()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "uri-reference",
            },
        })
    ).toMatchInlineSnapshot('"z.url()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "uuid",
            },
        })
    ).toMatchInlineSnapshot('"z.uuid()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "date",
            },
        })
    ).toMatchInlineSnapshot('"z.iso.date()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "time",
            },
        })
    ).toMatchInlineSnapshot('"z.iso.time()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "date-time",
            },
        })
    ).toMatchInlineSnapshot('"z.iso.datetime()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "emoji",
            },
        })
    ).toMatchInlineSnapshot('"z.emoji()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "base64",
            },
        })
    ).toMatchInlineSnapshot('"z.base64()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "base64url",
            },
        })
    ).toMatchInlineSnapshot('"z.base64url()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "nanoid",
            },
        })
    ).toMatchInlineSnapshot('"z.nanoid()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "cuid",
            },
        })
    ).toMatchInlineSnapshot('"z.cuid()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "cuid2",
            },
        })
    ).toMatchInlineSnapshot('"z.cuid2()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "ulid",
            },
        })
    ).toMatchInlineSnapshot('"z.ulid()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "ipv4",
            },
        })
    ).toMatchInlineSnapshot('"z.ipv4()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "ipv6",
            },
        })
    ).toMatchInlineSnapshot('"z.ipv6()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "cidrv4",
            },
        })
    ).toMatchInlineSnapshot('"z.cidrv4()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "cidrv6",
            },
        })
    ).toMatchInlineSnapshot('"z.cidrv6()"');

    expect(
        getZodSchema({
            schema: {
                type: "string",
                format: "duration",
            },
        })
    ).toMatchInlineSnapshot('"z.iso.duration()"');
});

test("openapi number formats", () => {
    expect(
        getZodSchema({
            schema: {
                type: "number",
            },
        })
    ).toMatchInlineSnapshot('"z.number()"');

    expect(
        getZodSchema({
            schema: {
                type: "integer",
            },
        })
    ).toMatchInlineSnapshot('"z.int()"');

    expect(
        getZodSchema({
            schema: {
                type: "integer",
                format: "int32",
            },
        })
    ).toMatchInlineSnapshot('"z.int()"');

    expect(
        getZodSchema({
            schema: {
                type: "integer",
                format: "int64",
            },
        })
    ).toMatchInlineSnapshot('"z.bigint()"');
});
