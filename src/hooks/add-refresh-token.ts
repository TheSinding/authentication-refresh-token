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
    ["service", "entity"].forEach(prop => {
      if (prop in config) return;
      throw new Error("'Service' or 'Entity' is missing from configuration");
    });

    const rfservice = app.service(config.service);
    const existingToken = await rfservice.find({
      query: {
        clientId: typeof user.id === "number" ? `${user.id}` : user.id
      }
    });

    if (existingToken.total > 0) {
      const { refreshToken } = existingToken.data[0];
      Object.assign(result, { refreshToken });
      return context;
    }

    const token = await rfservice.create({
      refreshToken: UUIDV4(),
      clientId: user.id
    });

    Object.assign(result, { refreshToken: token.refreshToken });

    return context;
  };
};
