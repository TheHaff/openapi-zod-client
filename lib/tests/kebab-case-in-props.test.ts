import { getZodSchema } from "../src/openApiToZod";
import { test, expect } from "vitest";

test("kebab-case-in-props", () => {
    expect(
        getZodSchema({
            schema: {
                type: "object",
                properties: {
                    lowercase: { type: "string" },
                    "kebab-case": { type: "number" },
                },
            },
        })
    ).toMatchInlineSnapshot('"z.looseObject({ lowercase: z.string(), "kebab-case": z.number() }).partial()"');
});
