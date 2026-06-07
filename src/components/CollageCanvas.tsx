import { View, StyleSheet, Dimensions, Pressable, Image, Alert } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Clothing, OutfitLayoutItem } from "../types";
import { AsyncImage } from "./AsyncImage";
import { Colors, Radius } from "../design/tokens";
import { useState, useCallback, useEffect, useRef } from "react";
import { generateInitialLayout } from "./CollageCanvas.logic";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const SCREEN = Dimensions.get("window");
const CANVAS_W = SCREEN.width - 40; // 留边距
const CANVAS_H = SCREEN.width - 40;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;
const DEFAULT_SIZE = 100;

interface CollageCanvasProps {
  items: Clothing[];
  initialLayout?: OutfitLayoutItem[];
  onLayoutChange?: (layout: OutfitLayoutItem[]) => void;
  onItemImageCropped?: (clothingId: string, newUri: string) => void;
  readOnly?: boolean;
}

export function CollageCanvas({ items, initialLayout, onLayoutChange, onItemImageCropped, readOnly }: CollageCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 初始化每个衣物的布局状态
  const [layoutMap, setLayoutMap] = useState<Record<string, OutfitLayoutItem>>(() =>
    generateInitialLayout(items, initialLayout)
  );

  // 同步新加入或删除的衣物
  const prevItemIdsRef = useRef<string>("");
  useEffect(() => {
    const idsKey = items.map((i) => i.id).join(",");
    if (prevItemIdsRef.current === idsKey) return;
    prevItemIdsRef.current = idsKey;
    setLayoutMap((prev) => generateInitialLayout(items, undefined, prev));
  }, [items]);

  const notifyChange = useCallback(
    (map: Record<string, OutfitLayoutItem>) => {
      onLayoutChange?.(Object.values(map));
    },
    [onLayoutChange]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<OutfitLayoutItem>) => {
      setLayoutMap((prev) => {
        const next = { ...prev };
        if (next[id]) {
          next[id] = { ...next[id], ...patch };
        }
        notifyChange(next);
        return next;
      });
    },
    [notifyChange]
  );

  const bringToFront = useCallback(
    (id: string) => {
      setLayoutMap((prev) => {
        const next = { ...prev };
        const maxZ = Math.max(0, ...Object.values(next).map((l) => l.zIndex));
        if (next[id]) {
          next[id] = { ...next[id], zIndex: maxZ + 1 };
        }
        notifyChange(next);
        return next;
      });
    },
    [notifyChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      setLayoutMap((prev) => {
        const next = { ...prev };
        delete next[id];
        setSelectedId((sel) => (sel === id ? null : sel));
        notifyChange(next);
        return next;
      });
    },
    [notifyChange]
  );

  const layout = selectedId ? layoutMap[selectedId] : null;
  const selectedItem = items.find((i) => i.id === selectedId);

  const handleCrop = async (item: Clothing) => {
    const uri = item.imageNoBgUri || item.imageUri;
    try {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
      });
      const side = Math.min(width, height);
      const originX = (width - side) / 2;
      const originY = (height - side) / 2;

      const manipulator = ImageManipulator.manipulate(uri);
      manipulator.crop({ originX, originY, width: side, height: side });
      const rendered = await manipulator.renderAsync();
      const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
      manipulator.release();
      rendered.release();

      onItemImageCropped?.(item.id, result.uri);
    } catch (e) {
      console.error("Crop error:", e);
      Alert.alert("裁剪失败", String(e));
    }
  };

  return (
    <View>
      <View style={S.canvas}>
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            layout={layoutMap[item.id]}
            selected={selectedId === item.id}
            readOnly={readOnly}
            onSelect={() => {
              setSelectedId(item.id);
              bringToFront(item.id);
            }}
            onUpdate={(patch) => updateItem(item.id, patch)}
          />
        ))}
      </View>

      {!readOnly && layout && selectedItem && (
        <View style={S.toolbar}>
          <Pressable
            style={S.toolBtn}
            onPress={() => updateItem(selectedId!, { scale: Math.max(0.3, layout.scale - 0.15) })}
          >
            <View style={S.toolIcon}>
              <View style={S.minusLine} />
            </View>
          </Pressable>
          <Pressable
            style={S.toolBtn}
            onPress={() => updateItem(selectedId!, { scale: Math.min(3, layout.scale + 0.15) })}
          >
            <View style={S.toolIcon}>
              <View style={S.plusLine} />
              <View style={[S.plusLine, S.plusLineV]} />
            </View>
          </Pressable>
          <Pressable
            style={S.toolBtn}
            onPress={() => updateItem(selectedId!, { rotation: ((layout.rotation ?? 0) + 15) % 360 })}
          >
            <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            style={S.toolBtn}
            onPress={() => handleCrop(selectedItem)}
          >
            <Ionicons name="crop" size={18} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[S.toolBtn, S.toolBtnDanger]}
            onPress={() => removeItem(selectedId!)}
          >
            <View style={S.trashDot} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function DraggableItem({
  item,
  layout,
  selected,
  readOnly,
  onSelect,
  onUpdate,
}: {
  item: Clothing;
  layout?: OutfitLayoutItem;
  selected: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<OutfitLayoutItem>) => void;
}) {
  const offsetX = useSharedValue(layout?.x ?? 0);
  const offsetY = useSharedValue(layout?.y ?? 0);
  const currentScale = useSharedValue(layout?.scale ?? 1);

  useEffect(() => {
    if (layout) {
      offsetX.value = layout.x;
      offsetY.value = layout.y;
      currentScale.value = layout.scale;
    }
  }, [layout?.x, layout?.y, layout?.scale]);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .enabled(!readOnly)
    .onBegin(() => {
      runOnJS(onSelect)();
      startX.value = layout?.x ?? 0;
      startY.value = layout?.y ?? 0;
    })
    .onUpdate((e) => {
      offsetX.value = startX.value + e.translationX;
      offsetY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({ x: offsetX.value, y: offsetY.value });
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!readOnly)
    .onBegin(() => {
      runOnJS(onSelect)();
      startScale.value = layout?.scale ?? 1;
    })
    .onUpdate((e) => {
      currentScale.value = Math.max(0.3, Math.min(3, startScale.value * e.scale));
    })
    .onEnd(() => {
      runOnJS(onUpdate)({ scale: currentScale.value });
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: currentScale.value },
      { rotateZ: `${layout?.rotation ?? 0}deg` },
    ],
  }));

  const imageUri = item.imageNoBgUri || item.imageUri;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          S.itemWrap,
          animatedStyle,
          { zIndex: layout?.zIndex ?? 0 },
          selected && !readOnly && S.itemSelected,
        ]}
      >
        <Pressable onPress={onSelect} style={S.itemPress} disabled={readOnly}>
          <AsyncImage uri={imageUri} style={S.itemImage} />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const S = StyleSheet.create({
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    position: "relative",
    alignSelf: "center",
  },
  itemWrap: {
    position: "absolute",
    left: CENTER_X - DEFAULT_SIZE / 2,
    top: CENTER_Y - DEFAULT_SIZE / 2,
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  itemPress: {
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  itemImage: {
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
    resizeMode: "contain",
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolBtnDanger: {
    backgroundColor: "rgba(224,122,95,0.15)",
    borderColor: Colors.danger,
  },
  toolIcon: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  minusLine: {
    width: 14,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  plusLine: {
    position: "absolute",
    width: 14,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  plusLineV: {
    transform: [{ rotate: "90deg" }],
  },
  trashDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.danger,
  },
});
