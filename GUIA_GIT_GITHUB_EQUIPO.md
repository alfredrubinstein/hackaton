# Guía Completa: Git y GitHub para Trabajo en Equipo

Esta guía te ayudará a configurar tu proyecto en GitHub y trabajar colaborativamente con tu equipo de 5 programadores.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial (Primera Vez)](#configuración-inicial)
2. [Subir el Proyecto a GitHub](#subir-el-proyecto-a-github)
3. [Trabajar desde CMD (Línea de Comandos)](#trabajar-desde-cmd)
4. [Trabajar con Fork (Aplicación GUI)](#trabajar-con-fork)
5. [Flujo de Trabajo Colaborativo](#flujo-de-trabajo-colaborativo)
6. [Proceso de Pull Request para Administradores](#proceso-de-pull-request-para-administradores)
7. [Explicaciones para tu Equipo](#explicaciones-para-tu-equipo)
8. [Comandos Esenciales](#comandos-esenciales)
9. [Buenas Prácticas](#buenas-prácticas)

---

## 🚀 Configuración Inicial

### Paso 1: Crear cuenta en GitHub
1. Ve a [github.com](https://github.com)
2. Crea una cuenta (si no la tienes)
3. Verifica tu email

### Paso 2: Instalar Git (si no lo tienes)
- **Windows**: Descarga desde [git-scm.com](https://git-scm.com/download/win)
- Verifica instalación: `git --version` en CMD

### Paso 3: Configurar Git (solo primera vez)
```cmd
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Paso 4: Cómo saber cuál es mi nombre de usuario de GitHub

El nombre de usuario de GitHub es diferente a tu nombre de perfil. Es el identificador único que aparece en la URL de tu perfil.

**Para encontrar tu nombre de usuario:**

1. **Inicia sesión en GitHub** en [github.com](https://github.com)

2. **Haz clic en tu foto de perfil** (esquina superior derecha)

3. **Selecciona "Your profile"** (Tu perfil)

4. **Tu nombre de usuario aparece:**
   - En la **URL de la página**: `https://github.com/TU-NOMBRE-USUARIO`
   - Debajo de tu foto de perfil, en texto más pequeño
   - Es el texto que aparece después de `github.com/`

**Ejemplo:**
- Si tu URL es: `https://github.com/juan-perez`
- Tu nombre de usuario es: `juan-perez`

**Nota importante:**
- El nombre de usuario es **diferente** al nombre que aparece en tu perfil
- El nombre de usuario es **siempre en minúsculas** y puede contener guiones
- Es el que usarás en las URLs: `https://github.com/TU-USUARIO/repositorio.git`

**Si no estás seguro:**
1. Ve a tu perfil en GitHub
2. Copia la URL completa
3. El nombre de usuario es la parte después de `github.com/`
4. Ejemplo: `https://github.com/mi-usuario` → tu usuario es `mi-usuario`

---

## 📤 Subir el Proyecto a GitHub

### Opción A: Desde CMD

#### 1. Inicializar el repositorio local
```cmd
cd C:\Users\שלמה\Downloads\hackaton_23d\project
git init
```

#### 2. Agregar todos los archivos
```cmd
git add .
```

#### 3. Hacer el primer commit
```cmd
git commit -m "Initial commit: Proyecto hackaton 23d"
```

#### 4. Crear repositorio en GitHub
1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repositorio: `hackaton-23d` (o el que prefieras)
3. **NO marques** "Initialize with README" (ya tienes archivos)
4. Haz clic en "Create repository"

#### 5. Conectar repositorio local con GitHub
```cmd
git remote add origin https://github.com/TU-USUARIO/hackaton-23d.git
```
**⚠️ IMPORTANTE:** Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

**¿No sabes cuál es tu nombre de usuario?** 
- Ve a la sección [Paso 4: Cómo saber cuál es mi nombre de usuario de GitHub](#paso-4-cómo-saber-cuál-es-mi-nombre-de-usuario-de-github) más arriba en la sección de Configuración Inicial
- O simplemente ve a tu perfil en GitHub y copia el nombre que aparece después de `github.com/` en la URL

#### 6. Subir el código
```cmd
git branch -M main
git push -u origin main
```

### Opción B: Desde Fork

1. Abre **Fork**
2. Haz clic en **"New Repository"** o **File > New Repository**
3. Selecciona la carpeta del proyecto: `C:\Users\שלמה\Downloads\hackaton_23d\project`
4. Haz clic en **"Create"**
5. En Fork, haz clic en **"Remote"** > **"Add Remote"**
   - Nombre: `origin`
   - URL: `https://github.com/TU-USUARIO/hackaton-23d.git`
   - **⚠️ Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub** (ver sección anterior)
6. Haz clic derecho en **"main"** (o "master") > **"Push"**
   - Selecciona `origin` como remoto
   - Marca **"Set upstream"**
   - Haz clic en **"Push"**

---

## 💻 Trabajar desde CMD

### Flujo de Trabajo Diario

#### 1. Ver el estado de tus archivos
```cmd
git status
```
Muestra qué archivos han cambiado.

#### 2. Ver cambios específicos
```cmd
git diff
```
Muestra las diferencias línea por línea.

#### 3. Agregar archivos al staging
```cmd
# Agregar un archivo específico
git add nombre-archivo.js

# Agregar todos los archivos modificados
git add .

# Agregar todos los archivos .js
git add *.js
```

#### 4. Hacer commit (guardar cambios)
```cmd
git commit -m "Descripción clara de los cambios"
```
**Ejemplos de buenos mensajes:**
- `git commit -m "Agregar función de login"`
- `git commit -m "Corregir bug en cálculo de distancias"`
- `git commit -m "Actualizar estilos del componente RoomViewer"`

#### 5. Obtener cambios del servidor (PULL)
```cmd
git pull origin main
```
**SIEMPRE haz pull antes de hacer push** para evitar conflictos.

#### 6. Subir cambios al servidor (PUSH)
```cmd
git push origin main
```

### Comandos Útiles Adicionales

#### Ver historial de commits
```cmd
git log
```
Presiona `q` para salir.

#### Ver historial simplificado
```cmd
git log --oneline
```

#### Crear una nueva rama (branch)
```cmd
git branch nombre-de-la-rama
git checkout nombre-de-la-rama
```
O en una sola línea:
```cmd
git checkout -b nombre-de-la-rama
```

#### Cambiar de rama
```cmd
git checkout main
```

#### Ver todas las ramas
```cmd
git branch
```

#### Eliminar una rama local
```cmd
git branch -d nombre-de-la-rama
```

---

## 🍴 Trabajar con Fork

### Configuración Inicial

1. **Abrir el repositorio en Fork**
   - Abre Fork
   - File > Open Repository
   - Selecciona la carpeta del proyecto

2. **Configurar remoto (si no está configurado)**
   - Haz clic en **"Remote"** en el panel izquierdo
   - Si no existe `origin`, haz clic en **"+"** y agrega:
     - Nombre: `origin`
     - URL: `https://github.com/TU-USUARIO/hackaton-23d.git`
     - **⚠️ Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub**

### Flujo de Trabajo Diario en Fork

#### 1. Ver cambios
- Fork muestra automáticamente los archivos modificados en el panel izquierdo
- Los archivos aparecen con colores:
  - **Verde**: Archivos nuevos
  - **Amarillo**: Archivos modificados
  - **Rojo**: Archivos eliminados

#### 2. Agregar archivos al staging
- Haz clic derecho en un archivo > **"Stage"**
- O selecciona varios archivos y haz clic derecho > **"Stage"**
- Para agregar todos: haz clic derecho en **"Changes"** > **"Stage All"**

#### 3. Hacer commit
- En la parte inferior, escribe tu mensaje de commit
- Haz clic en **"Commit"**
- Ejemplo de mensaje: `Agregar validación de formulario`

#### 4. Obtener cambios (PULL)
- Haz clic en el botón **"Pull"** en la barra superior
- O haz clic derecho en **"origin/main"** > **"Pull"**
- Fork te mostrará si hay conflictos

#### 5. Subir cambios (PUSH)
- Haz clic en el botón **"Push"** en la barra superior
- O haz clic derecho en **"main"** > **"Push"**
- Selecciona `origin` como remoto

### Trabajar con Ramas en Fork

#### Crear nueva rama
1. Haz clic derecho en **"main"** > **"Create Branch"**
2. Escribe el nombre: `feature/login` o `fix/bug-calculo`
3. Fork cambiará automáticamente a esa rama

#### Cambiar de rama
- Haz doble clic en la rama que quieres usar
- O haz clic derecho > **"Checkout"**

#### Ver diferencias entre ramas
- Haz clic derecho en una rama > **"Compare with..."**
- Selecciona la rama con la que comparar

---

## 🔄 Flujo de Trabajo Colaborativo

### Para el Administrador del Repositorio

#### Invitar colaboradores a GitHub

1. Ve a tu repositorio en GitHub
2. Haz clic en **"Settings"** (Configuración)
3. En el menú lateral, haz clic en **"Collaborators"**
4. Haz clic en **"Add people"**
5. Escribe el nombre de usuario o email de cada colaborador
6. Selecciona el nivel de acceso: **"Write"** (pueden hacer push)
7. Envía la invitación

### Para los Colaboradores

#### Clonar el repositorio (primera vez)

**Desde CMD:**
```cmd
cd C:\Users\TuUsuario\Documents
git clone https://github.com/TU-USUARIO/hackaton-23d.git
cd hackaton-23d
```
**⚠️ Reemplaza `TU-USUARIO` con el nombre de usuario del dueño del repositorio** (puede ser el tuyo o el del administrador del proyecto)

**Desde Fork:**
1. Abre Fork
2. File > Clone Repository
3. URL: `https://github.com/TU-USUARIO/hackaton-23d.git`
   - **⚠️ Reemplaza `TU-USUARIO` con el nombre de usuario del dueño del repositorio**
4. Selecciona dónde guardarlo
5. Haz clic en **"Clone"**

### Flujo de Trabajo con Pull Requests

#### Opción 1: Trabajo Directo (para equipos pequeños)

1. **Antes de empezar a trabajar:**
   ```cmd
   git pull origin main
   ```

2. **Hacer tus cambios y commit:**
   ```cmd
   git add .
   git commit -m "Descripción de cambios"
   ```

3. **Subir cambios:**
   ```cmd
   git push origin main
   ```

#### Opción 2: Trabajo con Ramas (recomendado)

Esta es la forma **recomendada** para trabajar en equipo. Cada desarrollador crea su propia rama para trabajar en una funcionalidad específica.

##### Paso 1: Crear tu rama ANTES de hacer cambios

**IMPORTANTE:** Siempre crea la rama desde `main` actualizada para evitar conflictos.

**Desde CMD:**
```cmd
# 1. Asegúrate de estar en main y actualizada
git checkout main
git pull origin main

# 2. Crea tu nueva rama
git checkout -b feature/tu-nombre-funcionalidad

# Ejemplos de nombres de ramas:
# git checkout -b feature/juan-login
# git checkout -b feature/maria-dashboard
# git checkout -b fix/pepe-bug-calculo
# git checkout -b feature/ana-zustand-integration
```

**Desde Fork:**
1. Asegúrate de estar en la rama `main`
2. Haz clic derecho en `main` > **"Pull"** para actualizar
3. Haz clic derecho en `main` > **"Create Branch"**
4. Escribe el nombre de tu rama (ej: `feature/tu-nombre-funcionalidad`)
5. Fork cambiará automáticamente a tu nueva rama

**Convenciones de nombres para ramas:**
- `feature/nombre-funcionalidad` - Para nuevas funcionalidades
- `fix/descripcion-bug` - Para correcciones de bugs
- `refactor/descripcion` - Para refactorización de código
- `docs/descripcion` - Para cambios en documentación

##### Paso 2: Trabajar en tu rama

Ahora puedes hacer todos los cambios que necesites en tu rama:

**Desde CMD:**
```cmd
# Hacer tus cambios en el código...
# Luego guardar los cambios:

git add .
git commit -m "Agregar nueva funcionalidad: descripción clara"
git push origin feature/tu-nombre-funcionalidad
```

**Desde Fork:**
1. Haz tus cambios en el código
2. Fork mostrará los archivos modificados
3. Haz clic derecho en los archivos > **"Stage"**
4. Escribe tu mensaje de commit
5. Haz clic en **"Commit"**
6. Haz clic en **"Push"** y selecciona tu rama

##### Paso 3: Crear Pull Request en GitHub

Una vez que hayas hecho push de tu rama:

1. **Ve a tu repositorio en GitHub**
   - URL: `https://github.com/TU-USUARIO/hackaton-23d`

2. **GitHub mostrará un banner** con el botón **"Compare & pull request"**
   - Si no lo ves, ve a la pestaña **"Pull requests"**
   - Haz clic en **"New pull request"**
   - Selecciona tu rama en el menú desplegable

3. **Completa la información del Pull Request:**
   - **Título:** Descripción breve de los cambios
     - Ejemplo: `Agregar sistema de autenticación con Zustand`
   - **Descripción:** Explica qué cambios hiciste y por qué
     - Incluye capturas de pantalla si es relevante
     - Menciona si hay algo que el revisor debe saber
   - **Revisores:** Selecciona al administrador o miembros del equipo
   - **Etiquetas:** Agrega etiquetas si es necesario (opcional)

4. **Haz clic en "Create pull request"**

##### Paso 4: Esperar revisión

- El administrador o los revisores revisarán tu código
- Pueden hacer comentarios o solicitar cambios
- Responde a los comentarios y haz los cambios necesarios
- Cuando hagas cambios, simplemente haz push a la misma rama:
  ```cmd
  git add .
  git commit -m "Aplicar cambios solicitados en revisión"
  git push origin feature/tu-nombre-funcionalidad
  ```

##### Paso 5: Actualizar tu rama local después de la fusión

Una vez que el Pull Request sea fusionado:

**Desde CMD:**
```cmd
# Volver a main
git checkout main

# Actualizar main con los cambios fusionados
git pull origin main

# Eliminar tu rama local (opcional, ya fue fusionada)
git branch -d feature/tu-nombre-funcionalidad
```

**Desde Fork:**
1. Haz doble clic en `main` para cambiar de rama
2. Haz clic derecho en `main` > **"Pull"**
3. Opcional: Haz clic derecho en tu rama > **"Delete"** para eliminarla localmente

---

## 👨‍💼 Proceso de Pull Request para Administradores

Como administrador del repositorio, tu responsabilidad es revisar, aprobar y fusionar los Pull Requests del equipo. Este proceso asegura la calidad del código y la coordinación del equipo.

### Paso 1: Recibir notificación de Pull Request

Cuando un colaborador crea un Pull Request, recibirás:
- **Email de notificación** (si tienes las notificaciones activadas)
- **Notificación en GitHub** (campana en la esquina superior derecha)
- **Banner en el repositorio** mostrando el nuevo PR

### Paso 2: Revisar el Pull Request

1. **Ve a la pestaña "Pull requests"** en tu repositorio
2. **Haz clic en el Pull Request** que quieres revisar
3. **Revisa la información:**
   - Lee el título y descripción
   - Revisa los archivos cambiados (pestaña "Files changed")
   - Verifica que el código sigue las convenciones del proyecto

### Paso 3: Revisar los cambios de código

**En la pestaña "Files changed":**

1. **Revisa cada archivo modificado:**
   - Código en **verde** = líneas agregadas
   - Código en **rojo** = líneas eliminadas
   - Puedes hacer clic en cualquier línea para dejar un comentario

2. **Deja comentarios específicos:**
   - Haz clic en el número de línea donde quieres comentar
   - Escribe tu comentario
   - Puedes sugerir cambios específicos
   - Haz clic en **"Add single comment"** o **"Start a review"**

3. **Tipos de comentarios:**
   - **Comentario general:** Para preguntas o observaciones
   - **Aprobación:** Si el código está bien
   - **Solicitar cambios:** Si hay problemas que deben corregirse

### Paso 4: Aprobar o solicitar cambios

**Opción A: Aprobar el Pull Request**

Si el código está correcto y listo:

1. En la pestaña **"Conversation"** del PR
2. Haz clic en **"Review changes"** (botón verde, esquina superior derecha)
3. Selecciona **"Approve"**
4. Opcionalmente, agrega un comentario final
5. Haz clic en **"Submit review"**

**Opción B: Solicitar cambios**

Si hay problemas que deben corregirse:

1. Haz clic en **"Review changes"**
2. Selecciona **"Request changes"**
3. **Explica claramente qué debe cambiarse:**
   - Sé específico sobre qué líneas o funciones
   - Explica por qué es necesario el cambio
   - Proporciona ejemplos si es posible
4. Haz clic en **"Submit review"**

**El colaborador recibirá una notificación** y podrá hacer los cambios necesarios.

### Paso 5: Verificar cambios después de solicitar modificaciones

Si solicitaste cambios:

1. **Espera a que el colaborador actualice el PR**
   - Verás nuevos commits en el PR
   - GitHub mostrará "New commits since your last review"

2. **Revisa los nuevos cambios:**
   - Ve a "Files changed" nuevamente
   - Verifica que se aplicaron tus sugerencias
   - Puedes dejar más comentarios si es necesario

3. **Cuando esté listo, aprueba el PR** (Paso 4, Opción A)

### Paso 6: Fusionar el Pull Request

Una vez que el PR está aprobado y listo:

1. **Ve a la página del Pull Request**
2. **Haz clic en el botón verde "Merge pull request"**
3. **Selecciona el método de fusión:**
   - **"Create a merge commit"** (recomendado) - Mantiene el historial completo
   - **"Squash and merge"** - Combina todos los commits en uno solo
   - **"Rebase and merge"** - Aplica los commits directamente sobre main
4. **Escribe un mensaje de commit** (opcional, GitHub sugiere uno)
5. **Haz clic en "Confirm merge"**

### Paso 7: Limpiar después de la fusión

Después de fusionar:

1. **GitHub te preguntará si quieres eliminar la rama**
   - Haz clic en **"Delete branch"** (recomendado)
   - Esto mantiene el repositorio limpio

2. **Actualiza tu repositorio local:**
   ```cmd
   git checkout main
   git pull origin main
   ```

### Resolver conflictos en Pull Requests

Si hay conflictos entre la rama y `main`:

1. **GitHub mostrará un mensaje** de conflicto en el PR
2. **Opciones para resolver:**

   **Opción A: Resolver en GitHub (recomendado para conflictos simples)**
   - Haz clic en **"Resolve conflicts"** en GitHub
   - GitHub te mostrará el editor de conflictos
   - Resuelve los conflictos manualmente
   - Haz clic en **"Mark as resolved"** y luego **"Commit merge"**

   **Opción B: Resolver localmente (para conflictos complejos)**
   ```cmd
   # El colaborador debe hacer esto:
   git checkout main
   git pull origin main
   git checkout feature/su-rama
   git merge main
   # Resolver conflictos manualmente
   git add .
   git commit -m "Resolver conflictos con main"
   git push origin feature/su-rama
   ```

### Buenas Prácticas para Administradores

1. **Revisa PRs rápidamente:**
   - No dejes PRs esperando días
   - Responde en 24-48 horas si es posible

2. **Sé constructivo en tus comentarios:**
   - Explica el "por qué", no solo el "qué"
   - Reconoce lo que está bien, no solo lo que está mal
   - Sugiere soluciones, no solo problemas

3. **Revisa el contexto completo:**
   - No solo mires el código, entiende la intención
   - Verifica que los cambios no rompan funcionalidad existente
   - Considera el impacto en otras partes del proyecto

4. **Comunica claramente:**
   - Si un PR necesita más trabajo, explica qué falta
   - Si un PR está listo, aprueba y fusiona rápidamente
   - Si hay dudas, pregunta antes de rechazar

5. **Mantén main estable:**
   - Solo fusiona PRs que estén completamente probados
   - Considera usar ramas de desarrollo si trabajas en features grandes
   - Asegúrate de que main siempre compile y funcione

### Checklist para Revisar un Pull Request

Antes de aprobar un PR, verifica:

- [ ] El código compila sin errores
- [ ] Los cambios cumplen con las convenciones del proyecto
- [ ] No hay código comentado innecesario
- [ ] Los nombres de variables/funciones son claros
- [ ] No hay console.logs o código de debug
- [ ] Los cambios no rompen funcionalidad existente
- [ ] El mensaje de commit es descriptivo
- [ ] La descripción del PR explica bien los cambios
- [ ] No hay conflictos con la rama main
- [ ] El código sigue las mejores prácticas del proyecto

---

## 👥 Explicaciones para tu Equipo

### Mensaje para Compartir con tu Equipo

```
¡Hola equipo!

He configurado nuestro proyecto en GitHub. Aquí están las instrucciones 
para empezar a trabajar:

1. INSTALACIÓN INICIAL:
   - Instalar Git: https://git-scm.com/download/win
   - Crear cuenta en GitHub (si no tienen)
   - Aceptar la invitación que les envié por email

2. CLONAR EL REPOSITORIO (primera vez):
   Desde CMD:
   git clone https://github.com/TU-USUARIO/hackaton-23d.git
   cd hackaton-23d
   
   (Reemplaza TU-USUARIO con el nombre de usuario del administrador del proyecto)

3. FLUJO DE TRABAJO DIARIO:
   a) Antes de empezar a trabajar:
      git pull origin main
   
   b) Hacer tus cambios en el código
   
   c) Guardar tus cambios:
      git add .
      git commit -m "Descripción clara de lo que hiciste"
      git push origin main

4. REGLAS IMPORTANTES:
   - SIEMPRE hacer pull antes de push
   - Escribir mensajes de commit claros
   - Si trabajas en una funcionalidad grande, crear una rama
   - Comunicar si vas a modificar archivos compartidos

5. SI HAY PROBLEMAS:
   - Si git pull muestra conflictos, NO hacer push
   - Contactarme para resolver juntos
   - Nunca hacer force push (git push --force)

¿Preguntas? Estoy disponible para ayudar.
```

### Guía Rápida de Referencia

Crea un archivo `GUIA_RAPIDA.md` con esto:

```markdown
# Guía Rápida Git - Comandos Esenciales

## Trabajo Diario
git pull origin main          # Obtener últimos cambios
git status                    # Ver qué cambió
git add .                     # Agregar todos los cambios
git commit -m "Mensaje"       # Guardar cambios
git push origin main          # Subir cambios

## Si trabajas en rama
git checkout -b mi-rama       # Crear y cambiar a rama
git push origin mi-rama       # Subir rama
# Luego crear Pull Request en GitHub

## Ver información
git log --oneline            # Ver historial
git status                    # Ver estado actual
```

---

## 📚 Comandos Esenciales

### Comandos Básicos

| Comando | Descripción |
|---------|-------------|
| `git status` | Ver estado de archivos |
| `git add .` | Agregar todos los cambios |
| `git commit -m "mensaje"` | Guardar cambios con mensaje |
| `git pull` | Obtener cambios del servidor |
| `git push` | Subir cambios al servidor |
| `git log` | Ver historial de commits |

### Comandos de Ramas

| Comando | Descripción |
|---------|-------------|
| `git branch` | Ver todas las ramas |
| `git branch nombre` | Crear nueva rama |
| `git checkout nombre` | Cambiar a otra rama |
| `git checkout -b nombre` | Crear y cambiar a rama |
| `git merge nombre` | Fusionar rama actual |

### Comandos de Información

| Comando | Descripción |
|---------|-------------|
| `git diff` | Ver diferencias sin agregar |
| `git diff --staged` | Ver diferencias agregadas |
| `git log --oneline` | Historial simplificado |
| `git show` | Ver último commit |

### Resolver Problemas Comunes

#### "Your branch is behind 'origin/main'"
```cmd
git pull origin main
```

#### "Merge conflict"
1. Abre los archivos con conflictos
2. Busca las marcas `<<<<<<<`, `=======`, `>>>>>>>`
3. Resuelve manualmente qué código mantener
4. Guarda el archivo
5. `git add .`
6. `git commit -m "Resolver conflictos"`

#### Deshacer cambios no guardados
```cmd
git checkout -- nombre-archivo.js
```

#### Deshacer último commit (mantener cambios)
```cmd
git reset --soft HEAD~1
```

---

## ✅ Buenas Prácticas

### 1. Mensajes de Commit Claros
✅ **Bueno:**
- `git commit -m "Agregar validación de email en formulario"`
- `git commit -m "Corregir cálculo de área en RoomViewer"`
- `git commit -m "Actualizar dependencias npm"`

❌ **Malo:**
- `git commit -m "cambios"`
- `git commit -m "fix"`
- `git commit -m "asdf"`

### 2. Hacer Pull Antes de Push
**SIEMPRE** hacer `git pull` antes de `git push` para evitar conflictos.

### 3. Commits Pequeños y Frecuentes
Es mejor hacer varios commits pequeños que uno grande al final del día.

### 4. Usar Ramas para Features Grandes
Si vas a trabajar en algo que tomará varios días, crea una rama:
```cmd
git checkout -b feature/nombre-funcionalidad
```

### 5. Comunicación
- Avisa al equipo si vas a modificar archivos compartidos
- Si hay conflictos, coordina con el equipo
- Usa Pull Requests para cambios importantes

### 6. No Hacer Force Push
**NUNCA** uses `git push --force` en la rama principal sin consultar.

### 7. Revisar Cambios Antes de Commit
```cmd
git diff
```
Revisa qué estás guardando antes de hacer commit.

---

## 🆘 Solución de Problemas

### Error: "fatal: not a git repository"
**Solución:** Estás en una carpeta que no es un repositorio Git. Ve a la carpeta del proyecto.

### Error: "Updates were rejected"
**Solución:** Alguien más subió cambios. Haz `git pull` primero, luego `git push`.

### Error: "Merge conflict"
**Solución:** 
1. Abre el archivo con conflicto
2. Busca las marcas de conflicto
3. Decide qué código mantener
4. Elimina las marcas `<<<<<<<`, `=======`, `>>>>>>>`
5. Guarda y haz commit

### Archivos que no se suben
**Verifica `.gitignore`:** Puede que el archivo esté siendo ignorado.

---

## 📞 Recursos Adicionales

- **Documentación oficial de Git**: [git-scm.com/doc](https://git-scm.com/doc)
- **GitHub Guides**: [guides.github.com](https://guides.github.com)
- **Fork Documentation**: [git-fork.com](https://git-fork.com)

---

## 📝 Checklist para Nuevos Colaboradores

- [ ] Git instalado (`git --version`)
- [ ] Cuenta de GitHub creada
- [ ] Invitación aceptada al repositorio
- [ ] Repositorio clonado localmente
- [ ] Configurado nombre y email en Git
- [ ] Probado hacer pull y push
- [ ] Leída esta guía completa

---

**¡Listo para trabajar en equipo! 🚀**

Si tienes dudas, consulta esta guía o pregunta al administrador del repositorio.

