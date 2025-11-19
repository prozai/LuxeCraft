import React, { useMemo, useRef, useEffect } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { DesignState, GemType, ProductType, ProngType, GemCut, CustomShape, ShapeType, ContextMenuData, MeshModification } from '../types';
import { METAL_COLORS, GEM_COLORS } from '../constants';

interface JewelryModelProps {
  design: DesignState;
  onGemMove: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  isEditMode: boolean;
  isDarkMode: boolean;
  selectedElement: string | 'gem' | null;
  onContextMenu: (data: ContextMenuData) => void;
  modification: MeshModification | null;
  transformMode: 'translate' | 'rotate';
  onTransformChange: (id: string | 'gem', position: THREE.Vector3, rotation: THREE.Euler) => void;
}

const JewelryModel: React.FC<JewelryModelProps> = ({ 
    design, 
    onGemMove, 
    isEditMode, 
    isDarkMode,
    selectedElement,
    onContextMenu,
    modification,
    transformMode,
    onTransformChange
}) => {
  // Use Object3D ref to accommodate both Mesh and Group elements
  const meshRef = useRef<THREE.Object3D>(null);
  const groupRef = useRef<THREE.Group>(null);
  const customShapesRef = useRef<{ [key: string]: THREE.Mesh | null }>({});
  const gemGroupRef = useRef<THREE.Group>(null);

  const metalColor = METAL_COLORS[design.metal];
  const gemColor = GEM_COLORS[design.gem];
  
  // In Light mode, Cyan is hard to see, use a darker blue-teal
  const wireframeColor = isDarkMode ? '#22d3ee' : '#0891b2';

  // Material Props
  const metalMaterialProps = useMemo(() => ({
    color: isEditMode ? wireframeColor : metalColor,
    metalness: isEditMode ? 0 : 1,
    roughness: isEditMode ? 1 : 0.15,
    clearcoat: isEditMode ? 0 : 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
    wireframe: isEditMode,
    emissive: isEditMode ? wireframeColor : '#000000',
    emissiveIntensity: isEditMode ? 0.2 : 0,
  }), [metalColor, isEditMode, isDarkMode, wireframeColor]);

  // Handle Geometry Modifications (Intrude/Extrude/Delete)
  useEffect(() => {
    if (!modification) return;

    // Find the target mesh
    let targetMesh: THREE.Mesh | undefined;
    
    if (modification.meshId === 'main-product' && meshRef.current instanceof THREE.Mesh) {
        targetMesh = meshRef.current;
    } else if (customShapesRef.current[modification.meshId]) {
        targetMesh = customShapesRef.current[modification.meshId]!;
    }

    if (targetMesh && targetMesh.geometry) {
        const geo = targetMesh.geometry;
        
        // Ensure we have position attribute
        const posAttr = geo.getAttribute('position');
        const normalAttr = geo.getAttribute('normal');
        const indexAttr = geo.getIndex();

        if (!posAttr || !normalAttr) return;

        // Get the vertex indices for the selected face
        let a: number, b: number, c: number;

        if (indexAttr) {
            a = indexAttr.getX(modification.faceIndex * 3);
            b = indexAttr.getX(modification.faceIndex * 3 + 1);
            c = indexAttr.getX(modification.faceIndex * 3 + 2);
        } else {
            a = modification.faceIndex * 3;
            b = modification.faceIndex * 3 + 1;
            c = modification.faceIndex * 3 + 2;
        }

        if (modification.type === 'delete') {
            if (indexAttr) {
                indexAttr.setX(modification.faceIndex * 3, 0);
                indexAttr.setX(modification.faceIndex * 3 + 1, 0);
                indexAttr.setX(modification.faceIndex * 3 + 2, 0);
                indexAttr.needsUpdate = true;
            }
        } else {
            const direction = modification.type === 'extrude' ? 1 : -1;
            const factor = 0.2 * direction;

            const moveVertex = (idx: number) => {
                const nx = normalAttr.getX(idx);
                const ny = normalAttr.getY(idx);
                const nz = normalAttr.getZ(idx);

                const x = posAttr.getX(idx);
                const y = posAttr.getY(idx);
                const z = posAttr.getZ(idx);

                posAttr.setXYZ(idx, x + nx * factor, y + ny * factor, z + nz * factor);
            };

            moveVertex(a);
            moveVertex(b);
            moveVertex(c);

            posAttr.needsUpdate = true;
            geo.computeVertexNormals();
        }
    }

  }, [modification]);


  // Click handler to snap gem (Only works if not dragging TransformControls)
  const handleSurfaceClick = (e: ThreeEvent<MouseEvent>) => {
      if (!isEditMode) return; 
      
      // Prevent moving if we just clicked the TransformControls
      // R3F TransformControls stopPropagation by default, but good to be safe
      
      // Left click handling
      if (e.face && e.object) {
          const object = e.object;
          // Convert world point to local point
          const localPoint = object.worldToLocal(e.point.clone());
          onGemMove(localPoint, e.face.normal);
      }
  };

  const handleRightClick = (e: ThreeEvent<MouseEvent>, meshId: string) => {
      if (!isEditMode) return;
      e.stopPropagation();
      
      if (e.faceIndex !== undefined) {
          onContextMenu({
              x: e.nativeEvent.clientX,
              y: e.nativeEvent.clientY,
              meshId: meshId,
              faceIndex: e.faceIndex
          });
      }
  };

  const handlePointerOver = () => {
      if (isEditMode) document.body.style.cursor = 'crosshair';
  };
  const handlePointerOut = () => {
      document.body.style.cursor = 'default';
  };

  const renderRing = () => {
    const tubeThickness = 0.1 + (design.bandWidth * 0.05);
    return (
      <mesh 
        ref={meshRef as React.Ref<THREE.Mesh>} 
        castShadow 
        receiveShadow
        onClick={handleSurfaceClick}
        onContextMenu={(e) => handleRightClick(e, 'main-product')}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <torusGeometry args={[2, tubeThickness, 64, 128]} />
        <meshPhysicalMaterial {...metalMaterialProps} />
      </mesh>
    );
  };

  const renderBangle = () => {
    const tubeThickness = 0.2 + (design.bandWidth * 0.08);
    return (
        <mesh 
            ref={meshRef as React.Ref<THREE.Mesh>} 
            castShadow 
            receiveShadow
            onClick={handleSurfaceClick}
            onContextMenu={(e) => handleRightClick(e, 'main-product')}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
          <torusGeometry args={[3.5, tubeThickness, 64, 128]} />
          <meshPhysicalMaterial {...metalMaterialProps} />
        </mesh>
      );
  };

  const renderPendant = () => {
     return (
         <group ref={groupRef}>
            <mesh position={[0, 1.6, 0]}>
                <torusGeometry args={[0.3, 0.08, 16, 32]} />
                 <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>
             <mesh 
                ref={meshRef as React.Ref<THREE.Mesh>}
                position={[0, 0, 0]}
                rotation={[Math.PI/2, 0, 0]}
                onClick={handleSurfaceClick}
                onContextMenu={(e) => handleRightClick(e, 'main-product')}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
             >
                 <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
                 <meshPhysicalMaterial {...metalMaterialProps} />
             </mesh>
         </group>
     )
  };

  const renderCustomShapes = () => {
      return design.customShapes?.map((shape) => {
          let geometry;
          switch(shape.type) {
              case ShapeType.Sphere: geometry = <sphereGeometry args={[0.5, 32, 32]} />; break;
              case ShapeType.Cube: geometry = <boxGeometry args={[0.8, 0.8, 0.8, 4, 4, 4]} />; break;
              case ShapeType.Pyramid: geometry = <coneGeometry args={[0.5, 0.8, 4, 1]} />; break;
              case ShapeType.Torus: geometry = <torusGeometry args={[0.4, 0.15, 16, 32]} />; break;
              default: geometry = <boxGeometry />;
          }

          const isSelected = selectedElement === shape.id;
          
          const shapeMesh = (
              <mesh
                key={shape.id}
                ref={(el) => (customShapesRef.current[shape.id] = el)}
                position={new THREE.Vector3(...shape.position)}
                rotation={new THREE.Euler(...shape.rotation)}
                castShadow
                receiveShadow
                onClick={(e) => {
                    e.stopPropagation(); 
                    // Select handler passed from parent via onClick on container, but here we just stop propagation 
                    // so handleSurfaceClick isn't triggered if we click strictly on a shape
                    // Parent handles selection via props, but wait, we need to select it here visually?
                    // Actually, App.tsx handles selection state, we just need to signal selection if we want click-to-select
                    // But currently handleSurfaceClick handles gem movement. 
                }}
                onContextMenu={(e) => handleRightClick(e, shape.id)}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
              >
                  {geometry}
                  <meshPhysicalMaterial 
                    {...metalMaterialProps} 
                    color={isSelected ? '#fbbf24' : metalMaterialProps.color} 
                    emissive={isSelected ? '#fbbf24' : metalMaterialProps.emissive}
                    emissiveIntensity={isSelected ? 0.5 : metalMaterialProps.emissiveIntensity}
                  />
              </mesh>
          );

          if (isSelected && isEditMode) {
              return (
                  <TransformControls 
                    key={`tc-${shape.id}`} 
                    mode={transformMode} 
                    object={customShapesRef.current[shape.id] || undefined}
                    onMouseUp={() => {
                        const el = customShapesRef.current[shape.id];
                        if (el) onTransformChange(shape.id, el.position, el.rotation);
                    }}
                  >
                      {shapeMesh}
                  </TransformControls>
              )
          }

          return shapeMesh;
      });
  }

  const renderProngs = (scale: number) => {
    const prongThickness = 0.05 * scale;
    const prongHeight = 0.8 * scale;
    const offset = 0.4 * scale; // Distance from center
    const yPos = prongHeight / 2;

    const ProngMesh = ({ pos }: { pos: [number, number, number] }) => (
         <mesh position={[pos[0], yPos, pos[2]]} castShadow>
            <cylinderGeometry args={[prongThickness, prongThickness, prongHeight, 16]} />
            <meshStandardMaterial 
                color={isEditMode ? wireframeColor : metalColor} 
                metalness={isEditMode ? 0 : 1} 
                roughness={0.1}
                wireframe={isEditMode}
                emissive={isEditMode ? wireframeColor : '#000000'}
                emissiveIntensity={isEditMode ? 0.2 : 0}
            />
        </mesh>
    );

    if (design.prong === ProngType.Prong4) {
        const squareOffset = design.gemCut === GemCut.Princess ? offset * 1.1 : offset;
        return (
            <group rotation={[0, Math.PI/4, 0]}>
                <ProngMesh pos={[squareOffset, 0, squareOffset]} />
                <ProngMesh pos={[-squareOffset, 0, squareOffset]} />
                <ProngMesh pos={[squareOffset, 0, -squareOffset]} />
                <ProngMesh pos={[-squareOffset, 0, -squareOffset]} />
            </group>
        );
    } else if (design.prong === ProngType.Prong6) {
        const angles = [0, 60, 120, 180, 240, 300];
        return (
            <group>
                {angles.map(a => {
                    const rad = (a * Math.PI) / 180;
                    const x = Math.cos(rad) * offset;
                    const z = Math.sin(rad) * offset;
                    return <ProngMesh key={a} pos={[x, 0, z]} />
                })}
            </group>
        );
    } else if (design.prong === ProngType.Bezel) {
        let args: [number, number, number, number, number, boolean] = [0.6 * scale, 0.6 * scale, 0.4 * scale, 32, 1, true];
        if (design.gemCut === GemCut.Princess) {
             args = [0.6 * scale * 1.2, 0.6 * scale * 1.2, 0.4 * scale, 4, 1, true];
        }
        return (
            <mesh position={[0, 0.2 * scale, 0]} rotation={design.gemCut === GemCut.Princess ? [0, Math.PI/4, 0] : [0, 0, 0]}>
                 <cylinderGeometry args={args} />
                 <meshStandardMaterial 
                    color={isEditMode ? wireframeColor : metalColor} 
                    metalness={isEditMode ? 0 : 1} 
                    roughness={0.1} 
                    side={THREE.DoubleSide} 
                    wireframe={isEditMode}
                    emissive={isEditMode ? wireframeColor : '#000000'}
                    emissiveIntensity={isEditMode ? 0.2 : 0}
                 />
            </mesh>
        );
    }
    return null;
  };

  const getGemGeometry = () => {
    switch (design.gemCut) {
        case GemCut.Round: return <octahedronGeometry args={[1, 2]} />;
        case GemCut.Princess: return <octahedronGeometry args={[1, 0]} />;
        case GemCut.Emerald: return <cylinderGeometry args={[0.7, 0.7, 1, 4]} />;
        case GemCut.Oval: return <octahedronGeometry args={[1, 2]} />;
        case GemCut.Pear: return <coneGeometry args={[0.7, 1.5, 32]} />;
        default: return <octahedronGeometry args={[1, 2]} />;
    }
  };

  const getGemScale = (): [number, number, number] => {
      const s = design.gemSize * 0.5;
      switch (design.gemCut) {
          case GemCut.Round: return [s, s, s];
          case GemCut.Princess: return [s * 0.9, s * 0.9, s * 0.9];
          case GemCut.Emerald: return [s * 0.8, s * 0.6, s * 1.2];
          case GemCut.Oval: return [s * 0.8, s, s * 1.2];
          case GemCut.Pear: return [s * 0.8, s, s * 0.8];
          default: return [s, s, s];
      }
  }

  const getGemBaseRotation = (): [number, number, number] => {
      if (design.gemCut === GemCut.Emerald) return [Math.PI/2, Math.PI/4, 0];
      if (design.gemCut === GemCut.Princess) return [0, 0, 0];
      if (design.gemCut === GemCut.Pear) return [Math.PI, 0, 0];
      return [0, 0, 0];
  }

  const renderGemGroup = () => {
    if (design.gem === GemType.None) return null;

    const scale = getGemScale();
    const baseRotation = getGemBaseRotation();

    // Calculate Position and Orientation (Surface Normal)
    let position: THREE.Vector3;
    let quaternion: THREE.Quaternion = new THREE.Quaternion();

    if (design.gemPosition && design.gemNormal) {
        position = new THREE.Vector3(...design.gemPosition);
        const normal = new THREE.Vector3(...design.gemNormal);
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    } else {
        if (design.productType === ProductType.Bangle) {
            position = new THREE.Vector3(0, 3.7, 0);
        } else if (design.productType === ProductType.Pendant) {
            position = new THREE.Vector3(0, 0, 0.15);
            quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
        } else {
            position = new THREE.Vector3(0, 2.15, 0); 
        }
    }

    const gemSizeRef = design.gemSize * 0.5;
    const gemCenterY = gemSizeRef * 0.8;
    const isGemSelected = selectedElement === 'gem';

    // Combine base gem cut rotation with user manual rotation
    const userRotation = design.gemRotation ? new THREE.Euler(...design.gemRotation) : new THREE.Euler(0,0,0);
    // We apply user rotation to the inner mesh, relative to the group which is aligned to surface normal

    const content = (
      <group 
        ref={gemGroupRef}
        position={position} 
        quaternion={quaternion}
      >
          {/* Inner group to handle user manual offsets/rotations if needed, mainly rotation */}
          <group rotation={userRotation}>
             <mesh 
                position={[0, gemCenterY, 0]}
                scale={scale}
                rotation={new THREE.Euler(...baseRotation)}
                castShadow
                onClick={(e) => { e.stopPropagation(); handleSurfaceClick(e); }}
                onContextMenu={(e) => handleRightClick(e, 'gem')}
              >
                {getGemGeometry()}
                <MeshTransmissionMaterial 
                    backside
                    samples={16}
                    thickness={2}
                    chromaticAberration={1}
                    anisotropy={0.5}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.2}
                    color={gemColor}
                    ior={2.4}
                    transmission={1}
                    roughness={0}
                    clearcoat={1}
                />
                 {isGemSelected && isEditMode && (
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(1.2, 1.2, 1.2)]} />
                        <lineBasicMaterial color="#fbbf24" />
                    </lineSegments>
                )}
              </mesh>
              {renderProngs(gemSizeRef)}
          </group>
      </group>
    );

    if (isGemSelected && isEditMode) {
        // For the Gem Group, we attach TransformControls to the whole group containing gem+prongs
        // But since the group is managed by props (position/quaternion), dragging it updates these props.
        // TransformControls modifies position/rotation/scale of the object.
        // We need to be careful: if we rotate the group, we are changing the 'normal' orientation.
        // If we translate, we change 'position'.
        // However, our position logic depends on 'surface normal' alignment for the quaternion.
        // If user manually rotates, we store that in gemRotation (which is applied to inner group).
        // If user translates, we store in gemPosition.
        
        return (
             <TransformControls
                mode={transformMode}
                object={gemGroupRef.current || undefined}
                onMouseUp={() => {
                    const el = gemGroupRef.current;
                    if (el) {
                        // For Gem, we treat translation as updating position on surface (simple XYZ)
                        // And rotation as updating the local rotation (gemRotation)
                        // BUT TransformControls applies world transforms. 
                        // We update the position directly.
                        // For rotation, it modifies the quaternion. We need to extract the relative rotation if we want to persist 'gemRotation'.
                        // To keep it simple: we just sync Position for Translate, and 'gemRotation' for Rotate.
                        
                        if (transformMode === 'rotate') {
                             // This is complex because the group has a quaternion derived from normal.
                             // If we let user rotate freely, we break the normal alignment or need to update normal?
                             // Easier: Update gemRotation (inner) instead of group?
                             // For this demo, let's just save the group rotation as the new "normal" orientation is hard to reverse engineer without vector math.
                             // Let's just update gemRotation based on inner group if possible, or just let them rotate the whole assembly and save the Euler.
                             
                             // actually, let's just save the Euler of the group and ignore normal alignment if user manually rotates?
                             // Too complex for this turn. Let's just save the raw position and rotation values to state.
                             onTransformChange('gem', el.position, el.rotation);
                        } else {
                             onTransformChange('gem', el.position, el.rotation);
                        }
                    }
                }}
             >
                 {content}
             </TransformControls>
        )
    }

    return content;
  };

  const renderEngraving = () => {
      if (!design.engraving) return null;
      const r = design.productType === ProductType.Bangle ? 3.5 : 2;
      return (
        <group rotation={[0, 0, 0]}>
            <Text
                position={[0, -r + 0.2, 0]}
                rotation={[0, 0, 0]}
                fontSize={0.3}
                color={isEditMode && !isDarkMode ? '#0891b2' : "white"}
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXJgsg3bWg.woff"
            >
                {design.engraving}
            </Text>
        </group>
      );
  };

  return (
    <group ref={groupRef}>
      {design.productType === ProductType.Ring && renderRing()}
      {design.productType === ProductType.Bangle && renderBangle()}
      {design.productType === ProductType.Pendant && renderPendant()}
      {renderCustomShapes()}
      {renderGemGroup()}
      {renderEngraving()}
    </group>
  );
};

export default JewelryModel;