import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("strictObjects-option", () => {
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ str: z.string() }).partial()"');
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    str: { type: "string" },
                },
            },
            options: {
                strictObjects: true,
            },
        })
    ).toMatchInlineSnapshot('"z.strictObject({ str: z.string() }).partial()"');
});
