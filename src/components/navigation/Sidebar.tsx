import { useState } from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Divider,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import * as Icons from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useNavigation } from '../../hooks/useNavigation'
import {
  getNavigationByRole,
  type NavigationItem,
} from '../../config/navigation.config'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  onToggle?: () => void
  variant?: 'permanent' | 'temporary'
  collapsed?: boolean
}

const DRAWER_WIDTH = 240
const COLLAPSED_WIDTH = 64

export function Sidebar({
  open = true,
  onClose,
  onToggle,
  variant = 'permanent',
  collapsed = false,
}: SidebarProps) {
  const { user } = useAuth()
  const { goTo, isRouteActive } = useNavigation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Obtener navegación según el rol del usuario
  const navigationItems = user ? getNavigationByRole(user.role) : []

  const handleToggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleNavigate = (path: string) => {
    goTo(path)
    if (variant === 'temporary' && onClose) {
      onClose()
    }
  }

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType
    return IconComponent ? <IconComponent /> : null
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isActive = isRouteActive(item.path || '')
    const isDisabled = item.disabled

    // Si el item es solo un divider
    if (item.divider) {
      return <Divider key={item.id} sx={{ my: 1 }} />
    }

    // Item con hijos (expandible)
    if (hasChildren) {
      return (
        <Box key={item.id}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleToggleExpand(item.id)}
              disabled={isDisabled}
              sx={{
                minHeight: 48,
                px: 2.5,
                pl: level * 2 + 2.5,
                justifyContent: collapsed ? 'center' : 'initial',
              }}
            >
              {item.icon && (
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {renderIcon(item.icon)}
                    </Badge>
                  ) : (
                    renderIcon(item.icon)
                  )}
                </ListItemIcon>
              )}

              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      opacity: isDisabled ? 0.5 : 1,
                      color: isActive ? 'primary.main' : 'inherit',
                    }}
                  />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>

          {!collapsed && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children?.map((child) =>
                  renderNavigationItem(child, level + 1)
                )}
              </List>
            </Collapse>
          )}
        </Box>
      )
    }

    // Item simple (sin hijos)
    const button = (
      <ListItemButton
        onClick={() => item.path && handleNavigate(item.path)}
        disabled={isDisabled}
        sx={{
          minHeight: 48,
          px: 2.5,
          pl: level * 2 + 2.5,
          justifyContent: collapsed ? 'center' : 'initial',
          bgcolor: isActive ? alpha('#1976d2', 0.08) : 'transparent',
          '&:hover': {
            bgcolor: isActive
              ? alpha('#1976d2', 0.12)
              : alpha('#000', 0.04),
          },
        }}
      >
        {item.icon && (
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: isActive ? 'primary.main' : 'inherit',
            }}
          >
            {item.badge ? (
              <Badge badgeContent={item.badge} color="error">
                {renderIcon(item.icon)}
              </Badge>
            ) : (
              renderIcon(item.icon)
            )}
          </ListItemIcon>
        )}

        {!collapsed && (
          <ListItemText
            primary={item.label}
            sx={{
              opacity: isDisabled ? 0.5 : 1,
              color: isActive ? 'primary.main' : 'inherit',
              '& .MuiListItemText-primary': {
                fontWeight: isActive ? 600 : 400,
              },
            }}
          />
        )}

        {!collapsed && item.badge && !item.icon && (
          <Badge badgeContent={item.badge} color="error" />
        )}
      </ListItemButton>
    )

    // Wrapper con tooltip si está colapsado
    return (
      <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
        {collapsed && item.label ? (
          <Tooltip title={item.label} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    )
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header con toggle button */}
      {variant === 'permanent' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            px: 1,
            py: 1,
            minHeight: 64,
          }}
        >
          {onToggle && (
            <IconButton onClick={onToggle} size="small">
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          )}
        </Box>
      )}

      <Divider />

      {/* Navigation List */}
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <List>
          {navigationItems.map((item) => renderNavigationItem(item))}
        </List>
      </Box>

      {/* Footer - User Info (collapsed mode) */}
      {collapsed && user && (
        <>
          <Divider />
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Tooltip title={`${user.name} (${user.role})`} placement="right">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </Box>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  )

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
