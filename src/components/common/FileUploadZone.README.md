# FileUploadZone Component

Componente React avanzado para subir archivos con las siguientes características:

## ✨ Características

- 🎨 **Preview visual** de archivos (imágenes, videos, PDFs)
- 📊 **Barra de progreso** durante la carga
- 🖱️ **Drag & drop** intuitivo
- ✅ **Validación automática** de tipo y tamaño
- 🔒 **Seguro** - Upload a través de backend protegido
- ♿ **Accesible** - Compatible con lectores de pantalla
- 📱 **Responsive** - Funciona en todos los dispositivos

## 🚀 Uso Básico

```tsx
import FileUploadZone from '@/components/common/FileUploadZone'

function MyComponent() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    
    try {
      const result = await uploadFile(file)
      console.log('Archivo subido:', result.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <FileUploadZone
      onUpload={handleUpload}
      loading={uploading}
      error={error}
    />
  )
}
```

## 📝 Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onUpload` | `(file: File) => Promise<void>` | **required** | Función que maneja la subida del archivo |
| `loading` | `boolean` | `false` | Muestra estado de carga |
| `error` | `string \| null` | `null` | Mensaje de error a mostrar |
| `accept` | `string` | `'application/pdf,video/*'` | Tipos de archivo aceptados |
| `maxSize` | `number` | `104857600` (100MB) | Tamaño máximo en bytes |
| `showPreview` | `boolean` | `true` | Muestra preview del archivo |
| `disabled` | `boolean` | `false` | Deshabilita el componente |
| `helperText` | `string` | `undefined` | Texto de ayuda debajo del componente |

## 💡 Ejemplos Avanzados

### Solo PDFs

```tsx
<FileUploadZone
  onUpload={handleUpload}
  accept="application/pdf"
  maxSize={10 * 1024 * 1024} // 10MB
  helperText="Solo archivos PDF hasta 10MB"
/>
```

### Solo Videos

```tsx
<FileUploadZone
  onUpload={handleUpload}
  accept="video/mp4,video/webm"
  maxSize={500 * 1024 * 1024} // 500MB
  helperText="Videos MP4 o WebM hasta 500MB"
/>
```

### Con Hook Personalizado

```tsx
function MyForm() {
  const { uploading, error, upload } = useFileUpload()

  return (
    <FileUploadZone
      onUpload={upload}
      loading={uploading}
      error={error}
      accept="image/*,application/pdf"
      showPreview={true}
      helperText="Imágenes o PDFs hasta 50MB"
    />
  )
}
```

### Sin Preview

```tsx
<FileUploadZone
  onUpload={handleUpload}
  showPreview={false}
  helperText="Los archivos se subirán directamente sin preview"
/>
```

## 🎨 Personalización

El componente usa Material-UI y respeta el theme de tu aplicación:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    error: { main: '#d32f2f' },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <FileUploadZone onUpload={handleUpload} />
    </ThemeProvider>
  )
}
```

## 🔒 Seguridad

El componente está diseñado para trabajar con un backend seguro:

1. **Validación en Frontend**: Tipo de archivo y tamaño
2. **Upload a Backend**: Archivo se envía a tu API
3. **Validación en Backend**: Re-valida tipo, tamaño y autenticación
4. **Cloudinary**: Backend sube a Cloudinary con credenciales protegidas

```typescript
// Backend (Express + Cloudinary SDK)
import { uploadToCloudinary } from './services/upload.service'

app.post('/api/upload', authenticate, async (req, res) => {
  const result = await uploadToCloudinary(
    req.file.buffer,
    'course-materials',
    'auto'
  )
  res.json({ url: result.url })
})
```

## 📊 Estados

El componente maneja 4 estados visuales:

1. **Empty**: Zona de drop con botón de selección
2. **Loading**: Barra de progreso animada
3. **Preview**: Muestra el archivo seleccionado
4. **Error**: Alert con mensaje de error

## ♿ Accesibilidad

- ✅ Input file oculto pero accesible
- ✅ Botones con aria-labels
- ✅ Navegación por teclado
- ✅ Mensajes de error descriptivos
- ✅ Contraste de colores WCAG AA

## 🧪 Tests

El componente incluye tests completos:

```bash
npm test FileUploadZone
```

Tests incluidos:
- Renderizado inicial
- Estado de loading
- Manejo de errores
- Drag & drop
- Preview de archivos
- Validación de tamaño
- Limpieza de archivos

## 🎯 Comparación con Código Anterior

| Característica | Antes | Ahora |
|----------------|-------|-------|
| Componente | `<input type="file" hidden />` | `<FileUploadZone />` |
| Preview | ❌ No | ✅ Sí (imágenes y videos) |
| Drag & drop | ❌ No | ✅ Sí |
| Progress bar | ❌ No | ✅ Sí |
| Validaciones | Manual | ✅ Automáticas |
| Seguridad | Frontend expone keys | ✅ Backend protegido |
| Tests | ❌ No | ✅ 10 tests |

## 🔄 Migración

Si tienes código antiguo:

```tsx
// ANTES ❌
<input
  type="file"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }}
/>

// DESPUÉS ✅
<FileUploadZone
  onUpload={uploadFile}
  loading={uploading}
  error={error}
/>
```

## 📚 Referencias

- [Material-UI Paper](https://mui.com/material-ui/react-paper/)
- [Cloudinary Upload](https://cloudinary.com/documentation/upload_images)
- [React File Upload Best Practices](https://react.dev/learn/responding-to-events)
