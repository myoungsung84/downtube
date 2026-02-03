import { Tooltip, TooltipProps } from '@mui/material'
import React from 'react'

type AppTooltipConfig = Pick<
  TooltipProps,
  'arrow' | 'enterDelay' | 'enterNextDelay' | 'leaveDelay' | 'placement'
>

const defaultTooltipConfig: AppTooltipConfig = {
  arrow: true,
  enterDelay: 300,
  enterNextDelay: 150,
  leaveDelay: 0,
  placement: 'bottom'
}

type AppTooltipProps = {
  title: React.ReactNode
  children: React.ReactElement
  tooltipConfig?: Partial<AppTooltipConfig>
  sx?: React.CSSProperties
  fullWidth?: boolean
} & Omit<
  TooltipProps,
  'title' | 'children' | 'arrow' | 'enterDelay' | 'enterNextDelay' | 'leaveDelay' | 'placement'
>

export default function AppTooltip({
  title,
  children,
  tooltipConfig,
  sx,
  fullWidth,
  ...rest
}: AppTooltipProps): React.JSX.Element {
  const config: AppTooltipConfig = React.useMemo(
    () => ({ ...defaultTooltipConfig, ...(tooltipConfig ?? {}) }),
    [tooltipConfig]
  )

  const child = React.isValidElement(children) ? children : <span>{children}</span>

  return (
    <Tooltip {...config} title={title} {...rest}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          ...(fullWidth ? { width: '100%' } : null),
          ...sx
        }}
      >
        {child}
      </span>
    </Tooltip>
  )
}
