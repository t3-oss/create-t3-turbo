import { Migration } from "@mikro-orm/migrations";

export class InitialMigration extends Migration {
  override name = "InitialMigration";

  override up(): void {
    this.addSql(
      'create table "post" ("id" text not null primary key, "title" text not null, "content" text not null, "created_at" datetime not null, "updated_at" datetime not null);',
    );
  }

  override down(): void {
    this.addSql('drop table if exists "post";');
  }
}
