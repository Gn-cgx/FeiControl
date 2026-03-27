import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

// Systemd services to check — override via SYSTEMD_WATCHED_SERVICES env var (comma-separated)
const SYSTEMD_SERVICES: string[] = process.env.SYSTEMD_WATCHED_SERVICES
  ? process.env.SYSTEMD_WATCHED_SERVICES.split(",").map((s) => s.trim()).filter(Boolean)
  : ["mission-control"];

export async function GET() {
  try {
    // CPU (load average as percentage)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpu = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

    // RAM
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ram = {
      used: parseFloat((usedMem / 1024 / 1024 / 1024).toFixed(2)),
      total: parseFloat((totalMem / 1024 / 1024 / 1024).toFixed(2)),
    };

    // Disk
    let diskUsed = 0;
    let diskTotal = 100;
    try {
      // macOS: df -g (1G blocks), Linux: df -BG
      const isMac = process.platform === "darwin";
      const dfCmd = isMac ? "df -g / | tail -1" : "df -BG / | tail -1";
      const { stdout } = await execAsync(dfCmd);
      const parts = stdout.trim().split(/\s+/);
      if (isMac) {
        // macOS: Filesystem 512-blocks Used Available Capacity ... OR with -g: Filesystem Gblocks Used Available ...
        diskTotal = parseInt(parts[1]) || 100;
        diskUsed = parseInt(parts[2]) || 0;
      } else {
        diskTotal = parseInt(parts[1].replace("G", ""));
        diskUsed = parseInt(parts[2].replace("G", ""));
      }
    } catch (error) {
      console.error("Failed to get disk stats:", error);
    }

    // Systemd Services (only on Linux)
    let activeServices = 0;
    let totalServices = SYSTEMD_SERVICES.length;
    if (process.platform === "linux") {
      try {
        for (const name of SYSTEMD_SERVICES) {
          const { stdout } = await execAsync(`systemctl is-active ${name} 2>/dev/null || true`);
          if (stdout.trim() === "active") activeServices++;
        }
      } catch (error) {
        console.error("Failed to get systemd stats:", error);
      }
    } else {
      // On macOS, check if processes are running by name instead
      totalServices = 0;
      activeServices = 0;
    }

    // Tailscale VPN Status
    let vpnActive = false;
    try {
      const { stdout } = await execAsync("tailscale status 2>/dev/null || true");
      vpnActive = stdout.trim().length > 0 && !stdout.includes("Tailscale is stopped") && !stdout.includes("not running");
    } catch {
      vpnActive = false;
    }

    // Firewall Status
    let firewallActive = false;
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync("/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || true");
        firewallActive = stdout.includes("enabled");
      } else {
        const { stdout } = await execAsync("ufw status 2>/dev/null | head -1 || true");
        firewallActive = stdout.includes("active");
      }
    } catch {
      firewallActive = false;
    }

    // Uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptime = `${days}d ${hours}h`;

    return NextResponse.json({
      cpu,
      ram,
      disk: { used: diskUsed, total: diskTotal },
      vpnActive,
      firewallActive,
      activeServices,
      totalServices,
      uptime,
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch system stats" },
      { status: 500 }
    );
  }
}
