import type { LiveBinding } from "./live-binding";
import type { LivePocRepository } from "./live-repository";
import { verifyLiveWebhook } from "./live-webhook";
import { createWebhookServer } from "./http-server";
export function createLivePocServer(binding: LiveBinding, repository: Pick<LivePocRepository, "receive">) {
  return createWebhookServer({ verify: (route, raw, signature) => verifyLiveWebhook(binding, route, raw, signature), receive: (route, event) => repository.receive(route, event), inboundSms: event => event.inboundSms });
}
