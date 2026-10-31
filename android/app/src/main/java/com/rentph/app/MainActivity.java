package com.rentph.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null) {
                    dispatchDefaultBack();
                    return;
                }

                getBridge().getWebView().evaluateJavascript(
                    "(() => { const dialog = document.querySelector('dialog[open]'); " +
                    "if (!dialog) return false; dialog.close(); return true; })()",
                    handled -> {
                        if (!"true".equals(handled)) {
                            dispatchDefaultBack();
                        }
                    }
                );
            }

            private void dispatchDefaultBack() {
                setEnabled(false);
                try {
                    getOnBackPressedDispatcher().onBackPressed();
                } finally {
                    setEnabled(true);
                }
            }
        });
    }
}
