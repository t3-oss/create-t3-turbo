import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export class PostClass extends TimeStamps {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public content!: string;
}

export const Post = getModelForClass(PostClass);
