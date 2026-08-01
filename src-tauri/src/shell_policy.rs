use std::path::{Component, Path, PathBuf};

pub const MAX_OUTPUT_CHARS: usize = 64 * 1024;

const BLOCKLIST: &[&str] = &[
    "format ",
    "rmdir /s",
    "del /f /s",
    "Remove-Item -Recurse",
    "Shutdown",
    "reg delete",
];

const POLICY_DENIED: &str = "POLICY_DENIED";

pub fn user_home() -> Result<PathBuf, String> {
    #[cfg(windows)]
    {
        std::env::var("USERPROFILE")
            .map(PathBuf::from)
            .map_err(|_| "USERPROFILE not set".to_string())
    }
    #[cfg(not(windows))]
    {
        std::env::var("HOME")
            .map(PathBuf::from)
            .map_err(|_| "HOME not set".to_string())
    }
}

fn path_contains_parent_ref(path: &Path) -> bool {
    path.components()
        .any(|component| matches!(component, Component::ParentDir))
}

/// Default to user HOME; canonicalize; must stay under `allow_root` (HOME).
pub fn resolve_cwd(requested: Option<&str>) -> Result<PathBuf, String> {
    let allow_root = user_home()?;
    let allow_root = allow_root
        .canonicalize()
        .map_err(|error| format!("failed to canonicalize HOME: {error}"))?;

    let cwd = match requested {
        Some(path) if !path.trim().is_empty() => PathBuf::from(path),
        _ => allow_root.clone(),
    };

    if path_contains_parent_ref(&cwd) {
        return Err(POLICY_DENIED.to_string());
    }

    let canonical = cwd
        .canonicalize()
        .map_err(|error| format!("invalid cwd: {error}"))?;

    if !canonical.starts_with(&allow_root) {
        return Err(POLICY_DENIED.to_string());
    }

    Ok(canonical)
}

/// Case-insensitive substring match against the blocklist.
pub fn is_command_blocked(command: &str) -> bool {
    let lower = command.to_lowercase();
    BLOCKLIST
        .iter()
        .any(|blocked| lower.contains(&blocked.to_lowercase()))
}

pub fn truncate_output(value: String, max: usize) -> String {
    if value.len() <= max {
        return value;
    }
    value.chars().take(max).collect()
}