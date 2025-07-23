@echo off
echo 🚀 Configurando proyecto WebLiqui_IA...

REM Verificar que estamos en un repositorio Git
if not exist ".git" (
    echo ❌ Error: Este directorio no es un repositorio Git
    pause
    exit /b 1
)

echo 📝 Configurando plantilla de mensajes de commit...
git config commit.template .gitmessage

echo ⚙️ Configurando editor...
git config core.editor "code --wait"

echo 🔧 Configurando aliases útiles...
git config alias.feat "!f() { git commit -m \"feat: $1\"; }; f"
git config alias.fix "!f() { git commit -m \"fix: $1\"; }; f"
git config alias.docs "!f() { git commit -m \"docs: $1\"; }; f"
git config alias.style "!f() { git commit -m \"style: $1\"; }; f"
git config alias.refactor "!f() { git commit -m \"refactor: $1\"; }; f"
git config alias.test "!f() { git commit -m \"test: $1\"; }; f"
git config alias.chore "!f() { git commit -m \"chore: $1\"; }; f"

echo 🎣 Configurando hooks de Git...
if not exist ".git\hooks" mkdir ".git\hooks"
copy ".githooks\commit-msg" ".git\hooks\commit-msg"

echo ✅ Configuración completada!
echo.
echo 📋 Ahora puedes usar:
echo   git commit          - Para commit con plantilla completa
echo   git feat "mensaje"   - Para commits de nueva funcionalidad
echo   git fix "mensaje"    - Para commits de corrección
echo   git docs "mensaje"   - Para commits de documentación
echo.
echo 📖 Lee CONTRIBUTING.md para más información sobre las reglas de commit.
pause
