#[tauri::command]
async fn export_data(
  app: tauri::AppHandle,
  data: String,
  filename: String,
) -> Result<String, String> {
  let bytes = data.into_bytes();

  #[cfg(target_os = "android")]
  {
    use tauri_plugin_android_fs::{AndroidFsExt, PublicGeneralPurposeDir};

    let api = app.android_fs_async();
    let storage = api.public_storage();
    storage
      .request_permission()
      .await
      .map_err(|e| e.to_string())?;
    let relative = format!("{}", filename);
    let uri = storage
      .write_new(
        None,
        PublicGeneralPurposeDir::Download,
        &relative,
        Some("application/json"),
        &bytes,
      )
      .await
      .map_err(|e| e.to_string())?;
    return Ok(uri.uri);
  }

  #[cfg(not(target_os = "android"))]
  {
    use tauri::Manager;
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let path = dir.join(&filename);
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;
    return Ok(path.to_string_lossy().to_string());
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_android_fs::init())
    .invoke_handler(tauri::generate_handler![export_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
