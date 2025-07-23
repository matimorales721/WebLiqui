# WebLiqui_IA
Este es el proyecto donde voy guardando todo lo que me traigo de la IA para ir usando

## Estructura del Proyecto

WebLiqui/
├── index.html
├── pages/
│   ├── login.html
│   ├── procesos.html
│   └── proceso.html
├── css/
│   └── styles.css
├── data/
│   └── procesos.json
└── js/
    └── (vacío por ahora, puedes agregar lógica JS modular)

## Reglas de Contribución

### Mensajes de Commit

**IMPORTANTE**: Todos los mensajes de commit deben estar en **ESPAÑOL**.

#### Configuración Inicial
```bash
# Aplicar plantilla de mensajes de commit
git config commit.template .gitmessage

# Configurar editor (opcional, para VS Code)
git config core.editor "code --wait"
```

#### Formato de Mensajes
- **Título**: Máximo 50 caracteres, en presente imperativo
- **Cuerpo**: Opcional, máximo 72 caracteres por línea
- **Tipo**: Usar prefijos según el tipo de cambio

#### Tipos de Commit Permitidos
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de errores  
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato, espacios, etc.
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar pruebas
- `chore:` - Cambios en build, dependencias, etc.

#### Ejemplos de Buenos Commits
```bash
feat: agrega filtro por proceso en pantalla principal
fix: corrige formato de fechas en detalle de proceso
style: mejora espaciado en filtros de cabecera
docs: actualiza documentación de instalación
```

#### Aliases Útiles
Puedes usar estos aliases para commits rápidos:
```bash
git feat "agrega nueva funcionalidad X"
git fix "corrige problema con Y"
git docs "actualiza documentación de Z"
```
