CREATE EXTENSION IF NOT EXISTS hstore;
create schema if not exists "assistant";

create table "assistant"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "messages" uuid[] not null,
    "meta" hstore
);


alter table "assistant"."conversations" enable row level security;

create table "assistant"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text not null default ''::text,
    "meta" json not null default '{}'::json,
    "conversation_id" uuid not null
);


alter table "assistant"."messages" enable row level security;

CREATE UNIQUE INDEX conversations_pkey ON assistant.conversations USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON assistant.messages USING btree (id);

alter table "assistant"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "assistant"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "assistant"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES assistant.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "assistant"."messages" validate constraint "messages_conversation_id_fkey";


alter table "daw"."users" drop constraint "users_username_key";

alter table "daw"."projects" drop constraint "projects_owner_id_fkey";

alter table "daw"."messages" drop constraint "messages_pkey";

alter table "daw"."users" drop constraint "users_pkey";

drop index if exists "daw"."messages_pkey";

drop index if exists "daw"."users_pkey";

drop index if exists "daw"."users_username_key";

drop table "daw"."messages";

drop table "daw"."users";

alter table "daw"."projects" add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "daw"."projects" validate constraint "projects_owner_id_fkey";


create extension if not exists "hstore" with schema "public" version '1.8';

create table "public"."audio_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "track_id" uuid not null,
    "name" text not null,
    "start_time" double precision not null,
    "duration" double precision not null,
    "volume" double precision not null default 1.0,
    "pitch" double precision not null default 0.0,
    "audio_url" text,
    "waveform_data" jsonb,
    "version" integer not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."audio_blocks" enable row level security;

create table "public"."characters" (
    "id" text not null,
    "name" text not null,
    "spec" text not null default 'chara_card_v2'::text,
    "spec_version" text not null default '2.0'::text,
    "description" text not null,
    "personality" text,
    "scenario" text,
    "first_mes" text,
    "mes_example" text,
    "creator_notes" text,
    "system_prompt" text,
    "post_history_instructions" text,
    "alternate_greetings" text[] default '{}'::text[],
    "character_book" jsonb default '{}'::jsonb,
    "tags" text[] default '{}'::text[],
    "creator" text default 'tvndra'::text,
    "character_version" text default '1.0'::text,
    "extensions" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."characters" enable row level security;

create table "public"."messages" (
    "id" text not null,
    "story_id" text not null,
    "content" text not null,
    "role" text not null,
    "character_id" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."messages" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "name" text,
    "email" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."project_settings" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "bpm" double precision not null default 120,
    "time_signature" text not null default '4/4'::text,
    "sample_rate" integer not null default 48000,
    "bit_depth" integer not null default 16,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."project_settings" enable row level security;

create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid
);


alter table "public"."projects" enable row level security;

create table "public"."scenes" (
    "id" text not null,
    "story_id" text not null,
    "current_scene" text not null,
    "chapter_title" text not null,
    "chapter_number" integer not null,
    "present_characters" text[] not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."scenes" enable row level security;

create table "public"."stories" (
    "id" text not null,
    "title" text not null,
    "genre" text,
    "setting" text,
    "user_name" text,
    "user_character" text,
    "user_role" text,
    "active_characters" text[] not null,
    "story_stage" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."stories" enable row level security;

create table "public"."tracks" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "name" text not null,
    "color" text not null,
    "volume" double precision not null default 1.0,
    "muted" boolean not null default false,
    "solo" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tracks" enable row level security;

create table "public"."user_presence" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "user_id" uuid not null,
    "locked_blocks" jsonb default '[]'::jsonb,
    "cursor_position" jsonb,
    "last_active" timestamp with time zone not null default now()
);


alter table "public"."user_presence" enable row level security;

create table "public"."user_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "theme" text not null default 'light'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."websocket_messages" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "user_id" uuid not null,
    "message_type" text not null,
    "payload" jsonb not null,
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX audio_blocks_pkey ON public.audio_blocks USING btree (id);

CREATE UNIQUE INDEX characters_id_key ON public.characters USING btree (id);

CREATE UNIQUE INDEX characters_pkey ON public.characters USING btree (id);

CREATE INDEX idx_audio_blocks_track_id ON public.audio_blocks USING btree (track_id);

CREATE INDEX idx_characters_name ON public.characters USING btree (name);

CREATE INDEX idx_messages_story_id ON public.messages USING btree (story_id);

CREATE INDEX idx_scenes_story_id ON public.scenes USING btree (story_id);

CREATE INDEX idx_stories_updated_at ON public.stories USING btree (updated_at);

CREATE INDEX idx_tracks_project_id ON public.tracks USING btree (project_id);

CREATE INDEX idx_user_presence_project_id ON public.user_presence USING btree (project_id);

CREATE INDEX idx_websocket_messages_project_id ON public.websocket_messages USING btree (project_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX project_settings_pkey ON public.project_settings USING btree (id);

CREATE UNIQUE INDEX project_settings_project_id_key ON public.project_settings USING btree (project_id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX scenes_pkey ON public.scenes USING btree (id);

CREATE UNIQUE INDEX stories_pkey ON public.stories USING btree (id);

CREATE UNIQUE INDEX tracks_pkey ON public.tracks USING btree (id);

CREATE UNIQUE INDEX user_presence_pkey ON public.user_presence USING btree (id);

CREATE UNIQUE INDEX user_presence_project_id_user_id_key ON public.user_presence USING btree (project_id, user_id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);

CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX websocket_messages_pkey ON public.websocket_messages USING btree (id);

alter table "public"."audio_blocks" add constraint "audio_blocks_pkey" PRIMARY KEY using index "audio_blocks_pkey";

alter table "public"."characters" add constraint "characters_pkey" PRIMARY KEY using index "characters_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."project_settings" add constraint "project_settings_pkey" PRIMARY KEY using index "project_settings_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."scenes" add constraint "scenes_pkey" PRIMARY KEY using index "scenes_pkey";

alter table "public"."stories" add constraint "stories_pkey" PRIMARY KEY using index "stories_pkey";

alter table "public"."tracks" add constraint "tracks_pkey" PRIMARY KEY using index "tracks_pkey";

alter table "public"."user_presence" add constraint "user_presence_pkey" PRIMARY KEY using index "user_presence_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."websocket_messages" add constraint "websocket_messages_pkey" PRIMARY KEY using index "websocket_messages_pkey";

alter table "public"."audio_blocks" add constraint "audio_blocks_track_id_fkey" FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE not valid;

alter table "public"."audio_blocks" validate constraint "audio_blocks_track_id_fkey";

alter table "public"."characters" add constraint "characters_id_key" UNIQUE using index "characters_id_key";

alter table "public"."messages" add constraint "messages_character_id_fkey" FOREIGN KEY (character_id) REFERENCES characters(id) not valid;

alter table "public"."messages" validate constraint "messages_character_id_fkey";

alter table "public"."messages" add constraint "messages_story_id_fkey" FOREIGN KEY (story_id) REFERENCES stories(id) not valid;

alter table "public"."messages" validate constraint "messages_story_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."project_settings" add constraint "project_settings_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_settings" validate constraint "project_settings_project_id_fkey";

alter table "public"."project_settings" add constraint "project_settings_project_id_key" UNIQUE using index "project_settings_project_id_key";

alter table "public"."projects" add constraint "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_user_id_fkey";

alter table "public"."scenes" add constraint "scenes_story_id_fkey" FOREIGN KEY (story_id) REFERENCES stories(id) not valid;

alter table "public"."scenes" validate constraint "scenes_story_id_fkey";

alter table "public"."tracks" add constraint "tracks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."tracks" validate constraint "tracks_project_id_fkey";

alter table "public"."user_presence" add constraint "user_presence_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."user_presence" validate constraint "user_presence_project_id_fkey";

alter table "public"."user_presence" add constraint "user_presence_project_id_user_id_key" UNIQUE using index "user_presence_project_id_user_id_key";

alter table "public"."user_presence" add constraint "user_presence_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_presence" validate constraint "user_presence_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_key" UNIQUE using index "user_settings_user_id_key";

alter table "public"."websocket_messages" add constraint "websocket_messages_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."websocket_messages" validate constraint "websocket_messages_project_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."audio_blocks" to "anon";

grant insert on table "public"."audio_blocks" to "anon";

grant references on table "public"."audio_blocks" to "anon";

grant select on table "public"."audio_blocks" to "anon";

grant trigger on table "public"."audio_blocks" to "anon";

grant truncate on table "public"."audio_blocks" to "anon";

grant update on table "public"."audio_blocks" to "anon";

grant delete on table "public"."audio_blocks" to "authenticated";

grant insert on table "public"."audio_blocks" to "authenticated";

grant references on table "public"."audio_blocks" to "authenticated";

grant select on table "public"."audio_blocks" to "authenticated";

grant trigger on table "public"."audio_blocks" to "authenticated";

grant truncate on table "public"."audio_blocks" to "authenticated";

grant update on table "public"."audio_blocks" to "authenticated";

grant delete on table "public"."audio_blocks" to "service_role";

grant insert on table "public"."audio_blocks" to "service_role";

grant references on table "public"."audio_blocks" to "service_role";

grant select on table "public"."audio_blocks" to "service_role";

grant trigger on table "public"."audio_blocks" to "service_role";

grant truncate on table "public"."audio_blocks" to "service_role";

grant update on table "public"."audio_blocks" to "service_role";

grant delete on table "public"."characters" to "anon";

grant insert on table "public"."characters" to "anon";

grant references on table "public"."characters" to "anon";

grant select on table "public"."characters" to "anon";

grant trigger on table "public"."characters" to "anon";

grant truncate on table "public"."characters" to "anon";

grant update on table "public"."characters" to "anon";

grant delete on table "public"."characters" to "authenticated";

grant insert on table "public"."characters" to "authenticated";

grant references on table "public"."characters" to "authenticated";

grant select on table "public"."characters" to "authenticated";

grant trigger on table "public"."characters" to "authenticated";

grant truncate on table "public"."characters" to "authenticated";

grant update on table "public"."characters" to "authenticated";

grant delete on table "public"."characters" to "service_role";

grant insert on table "public"."characters" to "service_role";

grant references on table "public"."characters" to "service_role";

grant select on table "public"."characters" to "service_role";

grant trigger on table "public"."characters" to "service_role";

grant truncate on table "public"."characters" to "service_role";

grant update on table "public"."characters" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."project_settings" to "anon";

grant insert on table "public"."project_settings" to "anon";

grant references on table "public"."project_settings" to "anon";

grant select on table "public"."project_settings" to "anon";

grant trigger on table "public"."project_settings" to "anon";

grant truncate on table "public"."project_settings" to "anon";

grant update on table "public"."project_settings" to "anon";

grant delete on table "public"."project_settings" to "authenticated";

grant insert on table "public"."project_settings" to "authenticated";

grant references on table "public"."project_settings" to "authenticated";

grant select on table "public"."project_settings" to "authenticated";

grant trigger on table "public"."project_settings" to "authenticated";

grant truncate on table "public"."project_settings" to "authenticated";

grant update on table "public"."project_settings" to "authenticated";

grant delete on table "public"."project_settings" to "service_role";

grant insert on table "public"."project_settings" to "service_role";

grant references on table "public"."project_settings" to "service_role";

grant select on table "public"."project_settings" to "service_role";

grant trigger on table "public"."project_settings" to "service_role";

grant truncate on table "public"."project_settings" to "service_role";

grant update on table "public"."project_settings" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."scenes" to "anon";

grant insert on table "public"."scenes" to "anon";

grant references on table "public"."scenes" to "anon";

grant select on table "public"."scenes" to "anon";

grant trigger on table "public"."scenes" to "anon";

grant truncate on table "public"."scenes" to "anon";

grant update on table "public"."scenes" to "anon";

grant delete on table "public"."scenes" to "authenticated";

grant insert on table "public"."scenes" to "authenticated";

grant references on table "public"."scenes" to "authenticated";

grant select on table "public"."scenes" to "authenticated";

grant trigger on table "public"."scenes" to "authenticated";

grant truncate on table "public"."scenes" to "authenticated";

grant update on table "public"."scenes" to "authenticated";

grant delete on table "public"."scenes" to "service_role";

grant insert on table "public"."scenes" to "service_role";

grant references on table "public"."scenes" to "service_role";

grant select on table "public"."scenes" to "service_role";

grant trigger on table "public"."scenes" to "service_role";

grant truncate on table "public"."scenes" to "service_role";

grant update on table "public"."scenes" to "service_role";

grant delete on table "public"."stories" to "anon";

grant insert on table "public"."stories" to "anon";

grant references on table "public"."stories" to "anon";

grant select on table "public"."stories" to "anon";

grant trigger on table "public"."stories" to "anon";

grant truncate on table "public"."stories" to "anon";

grant update on table "public"."stories" to "anon";

grant delete on table "public"."stories" to "authenticated";

grant insert on table "public"."stories" to "authenticated";

grant references on table "public"."stories" to "authenticated";

grant select on table "public"."stories" to "authenticated";

grant trigger on table "public"."stories" to "authenticated";

grant truncate on table "public"."stories" to "authenticated";

grant update on table "public"."stories" to "authenticated";

grant delete on table "public"."stories" to "service_role";

grant insert on table "public"."stories" to "service_role";

grant references on table "public"."stories" to "service_role";

grant select on table "public"."stories" to "service_role";

grant trigger on table "public"."stories" to "service_role";

grant truncate on table "public"."stories" to "service_role";

grant update on table "public"."stories" to "service_role";

grant delete on table "public"."tracks" to "anon";

grant insert on table "public"."tracks" to "anon";

grant references on table "public"."tracks" to "anon";

grant select on table "public"."tracks" to "anon";

grant trigger on table "public"."tracks" to "anon";

grant truncate on table "public"."tracks" to "anon";

grant update on table "public"."tracks" to "anon";

grant delete on table "public"."tracks" to "authenticated";

grant insert on table "public"."tracks" to "authenticated";

grant references on table "public"."tracks" to "authenticated";

grant select on table "public"."tracks" to "authenticated";

grant trigger on table "public"."tracks" to "authenticated";

grant truncate on table "public"."tracks" to "authenticated";

grant update on table "public"."tracks" to "authenticated";

grant delete on table "public"."tracks" to "service_role";

grant insert on table "public"."tracks" to "service_role";

grant references on table "public"."tracks" to "service_role";

grant select on table "public"."tracks" to "service_role";

grant trigger on table "public"."tracks" to "service_role";

grant truncate on table "public"."tracks" to "service_role";

grant update on table "public"."tracks" to "service_role";

grant delete on table "public"."user_presence" to "anon";

grant insert on table "public"."user_presence" to "anon";

grant references on table "public"."user_presence" to "anon";

grant select on table "public"."user_presence" to "anon";

grant trigger on table "public"."user_presence" to "anon";

grant truncate on table "public"."user_presence" to "anon";

grant update on table "public"."user_presence" to "anon";

grant delete on table "public"."user_presence" to "authenticated";

grant insert on table "public"."user_presence" to "authenticated";

grant references on table "public"."user_presence" to "authenticated";

grant select on table "public"."user_presence" to "authenticated";

grant trigger on table "public"."user_presence" to "authenticated";

grant truncate on table "public"."user_presence" to "authenticated";

grant update on table "public"."user_presence" to "authenticated";

grant delete on table "public"."user_presence" to "service_role";

grant insert on table "public"."user_presence" to "service_role";

grant references on table "public"."user_presence" to "service_role";

grant select on table "public"."user_presence" to "service_role";

grant trigger on table "public"."user_presence" to "service_role";

grant truncate on table "public"."user_presence" to "service_role";

grant update on table "public"."user_presence" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

grant delete on table "public"."websocket_messages" to "anon";

grant insert on table "public"."websocket_messages" to "anon";

grant references on table "public"."websocket_messages" to "anon";

grant select on table "public"."websocket_messages" to "anon";

grant trigger on table "public"."websocket_messages" to "anon";

grant truncate on table "public"."websocket_messages" to "anon";

grant update on table "public"."websocket_messages" to "anon";

grant delete on table "public"."websocket_messages" to "authenticated";

grant insert on table "public"."websocket_messages" to "authenticated";

grant references on table "public"."websocket_messages" to "authenticated";

grant select on table "public"."websocket_messages" to "authenticated";

grant trigger on table "public"."websocket_messages" to "authenticated";

grant truncate on table "public"."websocket_messages" to "authenticated";

grant update on table "public"."websocket_messages" to "authenticated";

grant delete on table "public"."websocket_messages" to "service_role";

grant insert on table "public"."websocket_messages" to "service_role";

grant references on table "public"."websocket_messages" to "service_role";

grant select on table "public"."websocket_messages" to "service_role";

grant trigger on table "public"."websocket_messages" to "service_role";

grant truncate on table "public"."websocket_messages" to "service_role";

grant update on table "public"."websocket_messages" to "service_role";

create policy "Users can delete audio blocks for their projects"
on "public"."audio_blocks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete audio blocks of their projects"
on "public"."audio_blocks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can insert audio blocks for their projects"
on "public"."audio_blocks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can insert audio blocks to their projects"
on "public"."audio_blocks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update audio blocks for their projects"
on "public"."audio_blocks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update audio blocks of their projects"
on "public"."audio_blocks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view audio blocks for their projects"
on "public"."audio_blocks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view audio blocks of their projects"
on "public"."audio_blocks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (tracks
     JOIN projects ON ((tracks.project_id = projects.id)))
  WHERE ((tracks.id = audio_blocks.track_id) AND (projects.user_id = auth.uid())))));


create policy "Allow authenticated delete from characters"
on "public"."characters"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated insert to characters"
on "public"."characters"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated update to characters"
on "public"."characters"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow public read access to characters"
on "public"."characters"
as permissive
for select
to public
using (true);


create policy "Allow authenticated insert to messages"
on "public"."messages"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Allow public read access to messages"
on "public"."messages"
as permissive
for select
to public
using (true);


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can insert settings for their projects"
on "public"."project_settings"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update settings for their projects"
on "public"."project_settings"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view settings for their projects"
on "public"."project_settings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_settings.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete their own projects"
on "public"."projects"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own projects"
on "public"."projects"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own projects"
on "public"."projects"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own projects"
on "public"."projects"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow authenticated delete from scenes"
on "public"."scenes"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated insert to scenes"
on "public"."scenes"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated update to scenes"
on "public"."scenes"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow public read access to scenes"
on "public"."scenes"
as permissive
for select
to public
using (true);


create policy "Allow authenticated delete from stories"
on "public"."stories"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated insert to stories"
on "public"."stories"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated update to stories"
on "public"."stories"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow public read access to stories"
on "public"."stories"
as permissive
for select
to public
using (true);


create policy "Users can delete tracks for their projects"
on "public"."tracks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete tracks of their projects"
on "public"."tracks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can insert tracks for their projects"
on "public"."tracks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can insert tracks to their projects"
on "public"."tracks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update tracks for their projects"
on "public"."tracks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update tracks of their projects"
on "public"."tracks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view tracks for their projects"
on "public"."tracks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view tracks of their projects"
on "public"."tracks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tracks.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete their own presence"
on "public"."user_presence"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own presence"
on "public"."user_presence"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own presence"
on "public"."user_presence"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view presence for projects they have access to"
on "public"."user_presence"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = user_presence.project_id) AND (projects.user_id = auth.uid())))));


CREATE TRIGGER set_updated_at_audio_blocks BEFORE UPDATE ON public.audio_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_tracks BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
