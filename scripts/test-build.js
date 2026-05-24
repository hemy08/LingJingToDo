import { exec, spawn } from 'child_process'
import { platform } from 'os'

const isWindows = platform() === 'win32'

console.log('=== Build 场景进程清理测试 ===\n')

async function checkProcesses() {
  return new Promise(resolve => {
    const cmd = isWindows ? 'tasklist | findstr "lingjingtodo"' : 'ps aux | grep lingjingtodo'
    exec(cmd, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log('✓ 没有残留进程')
        resolve(false)
      } else {
        console.log('⚠ 发现残留进程:\n' + stdout)
        resolve(true)
      }
    })
  })
}

async function buildApp() {
  console.log('1. 开始构建应用...')
  return new Promise(resolve => {
    const buildProcess = spawn('npm', ['run', 'tauri', 'build'], {
      stdio: 'inherit',
      shell: true,
    })

    buildProcess.on('exit', code => {
      console.log(`\n构建完成，退出码: ${code}`)
      resolve(code)
    })
  })
}

async function runApp() {
  console.log('\n2. 启动应用...')
  return new Promise(resolve => {
    const appPath = isWindows
      ? './lingjing_server/target/release/lingjingtodo.exe'
      : './lingjing_server/target/release/lingjingtodo'

    const appProcess = spawn(appPath, [], {
      stdio: 'inherit',
      shell: true,
    })

    // 5秒后关闭应用
    setTimeout(() => {
      console.log('\n3. 关闭应用...')
      if (isWindows) {
        exec('taskkill /F /IM lingjingtodo.exe')
      } else {
        appProcess.kill('SIGTERM')
      }

      // 等待1秒后检查进程
      setTimeout(async () => {
        const hasProcess = await checkProcesses()
        if (!hasProcess) {
          console.log('\n✅ Build 场景测试通过：应用关闭后没有残留进程')
        } else {
          console.log('\n❌ Build 场景测试失败：发现残留进程')
        }
        resolve()
      }, 1000)
    }, 5000)
  })
}

// 运行测试
;(async () => {
  await buildApp()
  await runApp()
})()
