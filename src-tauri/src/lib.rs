use dark_light::Mode;
use tauri_plugin_sql::{Migration, MigrationKind};

const DATABASE_PATH: &str = "sqlite:flashcards.db";

#[tauri::command]
fn system_theme() -> &'static str {
    match dark_light::detect() {
        Ok(Mode::Dark) => "dark",
        Ok(Mode::Light) | Ok(Mode::Unspecified) | Err(_) => "light",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: include_str!(
            "../../src/data/implementations/sqlite/migrations/001_create_initial_tables.sql"
        ),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DATABASE_PATH, migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![system_theme])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
