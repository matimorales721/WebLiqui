# Configuración de Desarrollo - WebLiqui_IA

## Configuración Git

Para aplicar la configuración de mensajes de commit en español, ejecuta estos comandos en la raíz del proyecto:

```bash
# Configurar plantilla de commit en español
git config commit.template .gitmessage

# Configurar editor (VS Code)
git config core.editor "code --wait"

# Opcional: Configurar aliases para commits rápidos
git config alias.feat "!f() { git commit -m \"feat: \$1\"; }; f"
git config alias.fix "!f() { git commit -m \"fix: \$1\"; }; f"
git config alias.docs "!f() { git commit -m \"docs: \$1\"; }; f"
git config alias.style "!f() { git commit -m \"style: \$1\"; }; f"
git config alias.refactor "!f() { git commit -m \"refactor: \$1\"; }; f"
git config alias.test "!f() { git commit -m \"test: \$1\"; }; f"
git config alias.chore "!f() { git commit -m \"chore: \$1\"; }; f"
```

## Reglas de Desarrollo

### 1. Idioma
- **Código**: Variables y funciones en español cuando sea posible
- **Comentarios**: Siempre en español
- **Commits**: OBLIGATORIO en español
- **Documentación**: En español

### 2. Estilo de Código
- Usar camelCase para variables y funciones
- Usar PascalCase para clases
- Indentación de 4 espacios
- Máximo 120 caracteres por línea

### 3. Estructura de Commits
```
tipo: descripción breve en español

Explicación detallada del cambio (opcional)
- Qué se cambió
- Por qué se cambió
- Impacto del cambio
```

### 4. Ejemplos de Buenos Commits
```
feat: agrega filtro por código de módulo en pestaña cabecera
fix: corrige formato de fechas en tarjeta de detalle del proceso
style: mejora espaciado entre filtros en pantalla de procesos
refactor: reorganiza lógica de filtrado para mejor mantenibilidad
docs: actualiza guía de instalación y configuración
test: agrega pruebas unitarias para función parsearFecha
chore: actualiza dependencias del proyecto
```

### 5. Commits NO Permitidos
```
❌ Add new filter functionality
❌ Fixed bug in date formatting
❌ Update docs
❌ WIP: working on filters
❌ quick fix
❌ asdf
```

## Comandos Útiles

```bash
# Commit rápido con tipo
git feat "nueva funcionalidad de filtrado"
git fix "error en cálculo de duración"

# Commit con editor para descripción detallada
git commit

# Ver plantilla de commit
cat .gitmessage
```
