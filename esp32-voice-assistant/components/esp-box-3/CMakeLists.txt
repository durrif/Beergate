if("${IDF_VERSION_MAJOR}.${IDF_VERSION_MINOR}" VERSION_GREATER_EQUAL "5.3")
    set(REQ esp_driver_i2c esp_driver_gpio esp_driver_i2s esp_driver_sdmmc esp_driver_sdspi)
    set(PRIV_REQ esp_driver_spi esp_driver_ledc)
else()
    set(REQ driver)
    set(PRIV_REQ "")
endif()

# Agregar lcd_touch como componente
list(APPEND REQ esp_lcd_touch_tt21100 esp_lcd_touch_gt911 esp_lcd_ili9341)

idf_component_register(
    SRCS "esp-box-3.c" "esp-box-3_idf5.c"
    INCLUDE_DIRS "include"
    PRIV_INCLUDE_DIRS "priv_include"
    REQUIRES 
        ${REQ} 
        fatfs
        esp_lvgl_port
        lvgl
        iot_button
        esp_codec_dev
    PRIV_REQUIRES 
        ${PRIV_REQ} 
        esp_lcd 
        spiffs 
        esp_psram
)
