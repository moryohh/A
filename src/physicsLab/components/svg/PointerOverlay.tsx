import React from 'react';
import { DiagramPart } from '../../types';

interface PointerOverlayProps {
  parts: DiagramPart[];
  activePartId: string | null;
  onHoverPart: (id: string | null) => void;
  onSelectPart: (id: string) => void;
  showLabels?: boolean;
  lineDisplayMode?: 'hover' | 'always';
}

export const PointerOverlay: React.FC<PointerOverlayProps> = ({
  parts,
  activePartId,
  onHoverPart,
  onSelectPart,
  showLabels = true,
  lineDisplayMode = 'hover',
}) => {
  if (!showLabels) return null;

  return (
    <g id="pointers-group" className="pointer-events-auto select-none">
      <defs>
        {/* Glow filter for active pointer lines and badges */}
        <filter id="pointer-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#0284c7" floodOpacity="0.85" />
        </filter>
        <filter id="label-badge-shadow" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
        <filter id="active-badge-shadow" x="-15%" y="-25%" width="130%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.35" />
        </filter>
      </defs>

      {parts.map((part) => {
        const { pointer } = part;
        const isActive = activePartId === part.id;
        const strokeColor = isActive ? '#0284c7' : '#94a3b8';
        const dotFill = isActive ? '#0284c7' : '#334155';
        const textColor = isActive ? '#0369a1' : '#1e293b';
        const badgeBorder = isActive ? '#0284c7' : '#cbd5e1';
        const badgeBg = isActive ? '#f0f9ff' : '#ffffff';
        const fontWeight = isActive ? '700' : '600';

        // Badge geometry centered around (pointer.labelX, pointer.labelY)
        const textLen = part.name.length;
        const badgeWidth = Math.max(76, Math.round(textLen * 8.4) + 24);
        const badgeHeight = 28;
        const badgeX = pointer.labelX - badgeWidth / 2;
        const badgeY = pointer.labelY - badgeHeight / 2;

        // Approach point (elbow if exists, else origin)
        const approachX = pointer.elbowX !== undefined ? pointer.elbowX : pointer.originX;
        const approachY = pointer.elbowY !== undefined ? pointer.elbowY : pointer.originY;

        // Calculate boundary touch point on the badge rectangle so lines STOP at the border
        let touchX = pointer.labelX;
        let touchY = pointer.labelY;

        const dx = pointer.labelX - approachX;
        const dy = pointer.labelY - approachY;

        if (Math.abs(dx) >= Math.abs(dy)) {
          // Primarily horizontal approach
          if (dx > 0) {
            touchX = badgeX;
            touchY = pointer.labelY;
          } else {
            touchX = badgeX + badgeWidth;
            touchY = pointer.labelY;
          }
        } else {
          // Primarily vertical approach
          if (dy > 0) {
            touchX = pointer.labelX;
            touchY = badgeY;
          } else {
            touchX = pointer.labelX;
            touchY = badgeY + badgeHeight;
          }
        }

        // Leader line path strictly stopping at touchX, touchY
        let pathD = '';
        if (pointer.elbowX !== undefined && pointer.elbowY !== undefined) {
          pathD = `M ${pointer.originX} ${pointer.originY} L ${pointer.elbowX} ${pointer.elbowY} L ${touchX} ${touchY}`;
        } else {
          pathD = `M ${pointer.originX} ${pointer.originY} L ${touchX} ${touchY}`;
        }

        // Determine if line should be visible:
        // In 'hover' mode, the line only shows when the user hovers or clicks this part (100% clean idle drawings!)
        // In 'always' mode, all lines show with a subtle stroke.
        const showLine = isActive || lineDisplayMode === 'always';

        // Direction indicator notch coordinates on the badge (a neat triangle pointing towards the anchor)
        // This gives instant visual connection even when leader line is idle!
        let notchPoints = '';
        const notchSize = 5;
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx > 0) {
            // Pointing left
            notchPoints = `${badgeX},${pointer.labelY - notchSize} ${badgeX - notchSize * 1.5},${pointer.labelY} ${badgeX},${pointer.labelY + notchSize}`;
          } else {
            // Pointing right
            notchPoints = `${badgeX + badgeWidth},${pointer.labelY - notchSize} ${badgeX + badgeWidth + notchSize * 1.5},${pointer.labelY} ${badgeX + badgeWidth},${pointer.labelY + notchSize}`;
          }
        } else {
          if (dy > 0) {
            // Pointing up
            notchPoints = `${pointer.labelX - notchSize},${badgeY} ${pointer.labelX},${badgeY - notchSize * 1.5} ${pointer.labelX + notchSize},${badgeY}`;
          } else {
            // Pointing down
            notchPoints = `${pointer.labelX - notchSize},${badgeY + badgeHeight} ${pointer.labelX},${badgeY + badgeHeight + notchSize * 1.5} ${pointer.labelX + notchSize},${badgeY + badgeHeight}`;
          }
        }

        return (
          <g
            key={part.id}
            id={`pointer-${part.id}`}
            className="cursor-pointer transition-all duration-200 group"
            onMouseEnter={() => onHoverPart(part.id)}
            onMouseLeave={() => onHoverPart(null)}
            onClick={() => onSelectPart(part.id)}
          >
            {/* Invisible generous hit-area for clicking / hovering */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x={badgeX - 4}
              y={badgeY - 4}
              width={badgeWidth + 8}
              height={badgeHeight + 8}
              fill="transparent"
            />

            {/* Visual Leader Line - Only illuminates on hover/select or in 'always' mode */}
            {showLine && (
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? '2.5' : '1.4'}
                strokeDasharray={isActive ? undefined : '4 3'}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isActive ? 1 : 0.45}
                filter={isActive ? 'url(#pointer-glow)' : undefined}
                className="transition-all duration-200"
              />
            )}

            {/* Origin Anchor Target Dot on the component */}
            <circle
              cx={pointer.originX}
              cy={pointer.originY}
              r={isActive ? 5.5 : 3.5}
              fill={dotFill}
              stroke="#ffffff"
              strokeWidth={isActive ? '2' : '1.5'}
              className="transition-all duration-150"
            />

            {/* Pulsing ring on active */}
            {isActive && (
              <circle
                cx={pointer.originX}
                cy={pointer.originY}
                r="11"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.8"
                opacity="0.8"
                className="animate-ping"
              />
            )}

            {/* Direction Indicator Notch */}
            <polygon
              points={notchPoints}
              fill={badgeBg}
              stroke={badgeBorder}
              strokeWidth={isActive ? '1.8' : '1.2'}
              className="transition-all duration-150"
            />

            {/* Solid Non-Overlapping Badge Background */}
            <rect
              x={badgeX}
              y={badgeY}
              width={badgeWidth}
              height={badgeHeight}
              rx="6"
              fill={badgeBg}
              stroke={badgeBorder}
              strokeWidth={isActive ? '2' : '1.2'}
              filter={isActive ? 'url(#active-badge-shadow)' : 'url(#label-badge-shadow)'}
              className="transition-all duration-150"
            />

            {/* Centered, Crisp Text Label inside the Badge */}
            <text
              x={pointer.labelX}
              y={pointer.labelY + 4}
              textAnchor="middle"
              fill={textColor}
              fontSize={isActive ? '13' : '12'}
              fontFamily="'Cairo', sans-serif"
              fontWeight={fontWeight}
              className="select-none transition-all duration-150 tracking-tight"
            >
              {part.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};
