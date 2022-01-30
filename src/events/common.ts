import type { ArgsOf } from "discordx";
import { Discord, On, Client } from "discordx";

@Discord()
export abstract class AppDiscord {
  @On("messageDelete")
  onMessageDelete([message]: ArgsOf<"messageDelete">, client: Client) {
    console.log("Message Deleted", client.user?.username, message.content);
  }
}
