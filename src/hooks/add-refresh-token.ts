// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext, Service } from "@feathersjs/feathers";
import UUIDV4 from "uuid/v4";

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { data, app, result, service } = context;

    const { strategy } = data;
    if (strategy !== "local" || strategy === "refresh-token") return context;

    const { "refresh-token": config } = app.get("authentication");
    if (!("user" in result)) return context;
    const { user } = result;

    if (!config) throw new Error("Refresh Token configuration is missing");
    ["service", "entity", "clientIdField"].forEach(prop => {
      if (prop in config) return;
      throw new Error(`Prop '${prop}' is missing from configuration`);
    });

    const { entity, clientIdField } = config;
    const entityService = app.service(config.service);
    const existingToken = await entityService.find({
      query: {
        [clientIdField]: typeof user.id === "number" ? `${user.id}` : user.id
      }
    });

    if (existingToken.total > 0) {
      const data = existingToken.data[0];
      Object.assign(result, { [entity]: data[entity] });
      return context;
    }

    const token = await entityService.create({
      [entity]: UUIDV4(),
      [clientIdField]: user.id
    });

    Object.assign(result, { [entity]: token[entity] });

    return context;
  };
};
