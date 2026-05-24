; 自定义 NSIS 安装脚本
; 用于设置中文快捷方式名称

!macro customHeader
  !include "x64.nsh"
!macroend

!macro preInit
  ; 设置安装前的操作
!macroend

!macro customInit
  ; 自定义初始化
!macroend

!macro customInstall
  ; 创建中文快捷方式
  CreateShortCut "$DESKTOP\灵境待办.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0
  
  ; 在开始菜单创建中文快捷方式
  CreateDirectory "$SMPROGRAMS\灵境待办"
  CreateShortCut "$SMPROGRAMS\灵境待办\灵境待办.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0
!macroend

!macro customUnInstall
  ; 删除中文快捷方式
  Delete "$DESKTOP\灵境待办.lnk"
  Delete "$SMPROGRAMS\灵境待办\灵境待办.lnk"
  RMDir "$SMPROGRAMS\灵境待办"
!macroend
