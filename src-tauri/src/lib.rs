use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub cpu_model: String,
    pub cpu_cores: usize,
    pub total_ram_gb: u64,
    pub free_ram_gb: u64,
    pub hostname: String,
    pub os: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub memory_mb: u64,
    pub cpu_usage: f32,
}

#[derive(Serialize, Deserialize)]
pub struct BoostResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    use sysinfo::System;
    let mut sys = System::new_all();
    sys.refresh_all();
    SystemInfo {
        cpu_model: sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or("Unknown".to_string()),
        cpu_cores: sys.cpus().len(),
        total_ram_gb: sys.total_memory() / 1024 / 1024 / 1024,
        free_ram_gb: sys.available_memory() / 1024 / 1024 / 1024,
        hostname: System::host_name().unwrap_or("Unknown".to_string()),
        os: System::long_os_version().unwrap_or("Windows".to_string()),
    }
}

#[tauri::command]
pub fn get_cpu_usage() -> f32 {
    use sysinfo::System;
    let mut sys = System::new();
    sys.refresh_cpu_usage();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_usage();
    sys.global_cpu_usage()
}

#[tauri::command]
pub fn get_ram_usage() -> f32 {
    use sysinfo::System;
    let mut sys = System::new();
    sys.refresh_memory();
    let total = sys.total_memory();
    let used = total - sys.available_memory();
    if total == 0 { return 0.0; }
    (used as f32 / total as f32) * 100.0
}

#[tauri::command]
pub fn get_processes() -> Vec<ProcessInfo> {
    use sysinfo::{System, ProcessesToUpdate};
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    let mut procs: Vec<ProcessInfo> = sys.processes().values()
        .map(|p| ProcessInfo {
            name: p.name().to_string_lossy().to_string(),
            pid: p.pid().as_u32(),
            memory_mb: p.memory() / 1024 / 1024,
            cpu_usage: p.cpu_usage(),
        })
        .filter(|p| !p.name.is_empty())
        .collect();
    procs.sort_by(|a, b| b.memory_mb.cmp(&a.memory_mb));
    procs.truncate(60);
    procs
}

#[tauri::command]
pub fn kill_process(pid: u32) -> bool {
    use sysinfo::{System, Pid, ProcessesToUpdate};
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    if let Some(process) = sys.process(Pid::from_u32(pid)) {
        process.kill();
        true
    } else { false }
}

#[tauri::command]
pub fn ping_host(host: String) -> u32 {
    let start = std::time::Instant::now();
    #[cfg(target_os = "windows")]
    let output = Command::new("ping").args(["-n", "1", "-w", "2000", &host]).output();
    #[cfg(not(target_os = "windows"))]
    let output = Command::new("ping").args(["-c", "1", "-W", "2", &host]).output();
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            if let Some(pos) = line.to_lowercase().find("time") {
                let after = &line[pos..];
                let num: String = after.chars().skip_while(|c| !c.is_ascii_digit()).take_while(|c| c.is_ascii_digit() || *c == '.').collect();
                if let Ok(ms) = num.parse::<f64>() { return ms.round() as u32; }
            }
        }
    }
    start.elapsed().as_millis() as u32
}

#[tauri::command]
pub fn flush_dns() -> bool {
    #[cfg(target_os = "windows")]
    return Command::new("ipconfig").arg("/flushdns").output().map(|o| o.status.success()).unwrap_or(false);
    #[cfg(not(target_os = "windows"))]
    true
}

#[tauri::command]
pub fn optimize_tcp() -> bool {
    #[cfg(target_os = "windows")]
    {
        let r1 = Command::new("netsh").args(["int", "tcp", "set", "global", "autotuninglevel=normal"]).output().map(|o| o.status.success()).unwrap_or(false);
        let r2 = Command::new("netsh").args(["int", "tcp", "set", "global", "rss=enabled"]).output().map(|o| o.status.success()).unwrap_or(false);
        return r1 && r2;
    }
    #[cfg(not(target_os = "windows"))]
    true
}

#[tauri::command]
pub fn apply_boost(target_process: Option<String>) -> BoostResult {
    #[cfg(target_os = "windows")]
    {
        let r1 = Command::new("powercfg").args(["/setactive", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"]).output().map(|o| o.status.success()).unwrap_or(false);
        if let Some(proc) = &target_process {
            let _ = Command::new("wmic").args(["process", "where", &format!("name=\"{}\"", proc), "CALL", "setpriority", "\"high priority\""]).output();
        }
        return BoostResult { success: r1, message: "Boost applied".to_string() };
    }
    #[cfg(not(target_os = "windows"))]
    BoostResult { success: true, message: "Simulated".to_string() }
}

#[tauri::command]
pub fn revert_boost() -> bool {
    #[cfg(target_os = "windows")]
    return Command::new("powercfg").args(["/setactive", "381b4222-f694-41f0-9685-ff5bb260df2e"]).output().map(|o| o.status.success()).unwrap_or(false);
    #[cfg(not(target_os = "windows"))]
    true
}

#[tauri::command]
pub fn window_minimize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") { let _ = win.minimize(); }
}

#[tauri::command]
pub fn window_maximize(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_maximized().unwrap_or(false) { let _ = win.unmaximize(); } else { let _ = win.maximize(); }
    }
}

#[tauri::command]
pub fn window_hide(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") { let _ = win.hide(); }
}

#[tauri::command]
pub fn get_api_url() -> String { "https://api.valcrown.com".to_string() }

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info, get_cpu_usage, get_ram_usage,
            get_processes, kill_process, ping_host, flush_dns,
            optimize_tcp, apply_boost, revert_boost,
            window_minimize, window_maximize, window_hide, get_api_url,
        ])
        .run(tauri::generate_context!())
        .expect("error running ValCrown");
}
