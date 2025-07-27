import path from "node:path";

import type { OpenAPIObject } from "openapi3-ts";
import type { Options } from "prettier";

import { getHandlebars } from "./getHandlebars";
import { maybePretty } from "./maybePretty";
import type { TemplateContext } from "./template-context";
import { getZodClientTemplateContext } from "./template-context";

type GenerateZodClientFromOpenApiArgs<TOptions extends TemplateContext["options"] = TemplateContext["options"]> = {
    openApiDoc: OpenAPIObject;
    templatePath?: string;
    prettierConfig?: Options | null;
    options?: TOptions;
    handlebars?: ReturnType<typeof getHandlebars>;
} & (
    | {
          distPath?: never;
          /** when true, will only return the result rather than writing it to a file, mostly used for easier testing purpose */
          disableWriteToFile: true;
      }
    | { distPath: string; disableWriteToFile?: false }
);

export const generateZodClientFromOpenAPI = async <TOptions extends TemplateContext["options"]>({
    openApiDoc,
    distPath,
    templatePath,
    prettierConfig,
    options,
    disableWriteToFile,
    handlebars,
}: GenerateZodClientFromOpenApiArgs<TOptions>): Promise<string> => {
    const data = getZodClientTemplateContext(openApiDoc, options);

    if (!templatePath) {
        templatePath = path.join(__dirname, "../src/templates/default.hbs");
    }

    const fs = await import("@liuli-util/fs-extra");
    const source = await fs.readFile(templatePath, "utf8");
    const hbs = handlebars ?? getHandlebars();
    const template = hbs.compile(source);
    const output = maybePretty(template(data), prettierConfig);

    if (!disableWriteToFile && distPath) {
        await fs.writeFile(distPath, output);
    }

    return output;
};
