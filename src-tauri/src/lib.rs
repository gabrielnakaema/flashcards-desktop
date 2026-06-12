use dark_light::Mode;

#[tauri::command]
fn system_theme() -> &'static str {
    match dark_light::detect() {
        Ok(Mode::Dark) => "dark",
        Ok(Mode::Light) | Ok(Mode::Unspecified) | Err(_) => "light",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![system_theme])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
