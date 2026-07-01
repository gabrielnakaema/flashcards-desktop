use dark_light::Mode;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg(not(feature = "webdriver"))]
const DATABASE_PATH: &str = "sqlite:flashcards.db";
#[cfg(feature = "webdriver")]
const DATABASE_PATH: &str = "sqlite:flashcards_test.db";

#[tauri::command]
fn database_path() -> &'static str {
    DATABASE_PATH
}

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

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DATABASE_PATH, migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![system_theme, database_path]);

    #[cfg(feature = "webdriver")]
    let builder = builder.plugin(tauri_plugin_webdriver::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
